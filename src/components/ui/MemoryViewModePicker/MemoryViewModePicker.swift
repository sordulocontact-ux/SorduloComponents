import SwiftUI

/// Deux modes de visualisation du feed de souvenirs : liste de cartes empilées
/// (`list`) ou carte géographique (`map`). Partagé entre la `HomeView` (feed réel)
/// et la démo interactive de `ThreeWaysView` (mini-Home dans le châssis d'iPhone).
enum MemoryViewMode: CaseIterable {
    case list, map
    var title: String { self == .list ? "Texte1" : "Texte2" }
}

/// Segmented control « Liste / Carte » pensé comme une **copie conforme de la barre
/// d'onglets iOS 26** (Liquid Glass) :
///
/// - **bulle de verre natif** (`glassEffect(.regular.tint(action).interactive())` dans un
///   `GlassEffectContainer`) qui réfracte le fond ; les labels (icône + libellé) sont
///   posés **par-dessus** → on voit le verre derrière le texte ;
/// - **grab** : au **toucher** (touch-down immédiat), la bulle **s'agrandit** (lift), comme
///   quand on attrape la sélection de la barre d'onglets ;
/// - **drag** : la bulle **suit le doigt** en continu, l'onglet bascule au passage du milieu ;
/// - **release / tap** : elle se cale avec un **bounce** rebondissant (`.bouncy`).
///
/// Un **seul** `DragGesture(minimumDistance: 0)` orchestre grab + drag + tap (c'est lui
/// qui permet l'agrandissement *dès le toucher*, impossible avec un `onTapGesture`). En
/// Reduce Transparency le système retombe sur un remplissage opaque cyan ; en Reduce
/// Motion, pas d'agrandissement ni de rebond.
struct MemoryViewModePicker: View {
    @Binding var mode: MemoryViewMode
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// Largeur intérieure mesurée du sélecteur (pour caler la bulle sur un demi-segment).
    @State private var innerWidth: CGFloat = 0
    /// Offset (bord gauche) de la bulle **pendant un glissé** ; `nil` hors glissé → calée.
    @State private var dragX: CGFloat?
    /// `true` tant que le doigt est posé → la bulle est agrandie (grab/lift).
    @State private var grabbing = false

    /// Calage horizontal de la bulle : ressort à **léger** dépassement (overshoot latéral
    /// volontairement contenu — l'essentiel du « rebond » passe par le squash vertical).
    private var settleAnimation: Animation {
        reduceMotion ? .easeInOut(duration: 0.2) : .spring(response: 0.34, dampingFraction: 0.74)
    }
    /// Agrandissement/relâché du grab — ressort court et réactif.
    private var grabAnimation: Animation {
        reduceMotion ? .easeInOut(duration: 0.12) : .spring(response: 0.26, dampingFraction: 0.6)
    }
    /// Largeur d'un demi-segment (= position calée de la bulle sur l'onglet « Carte »).
    private var segmentWidth: CGFloat { max(innerWidth / 2, 0) }
    /// Offset courant de la bulle : suit le doigt pendant un glissé, sinon se cale.
    private var pillX: CGFloat { dragX ?? (mode == .list ? 0 : segmentWidth) }
    /// Échelle de la bulle : agrandie pendant le grab (comme la sélection de la navbar).
    private var pillScale: CGFloat { (grabbing && !reduceMotion) ? 1.07 : 1.0 }
    /// Pics du squash « jelly » au changement d'onglet (neutres en Reduce Motion).
    private var squashY: CGFloat { reduceMotion ? 1.0 : 0.84 }
    private var stretchX: CGFloat { reduceMotion ? 1.0 : 1.10 }

    var body: some View {
        // Les labels imposent la taille ; la bulle de verre est posée en `.background`
        // (donc **bornée à LEUR hauteur** — sinon une `Capsule`, infiniment flexible,
        // gonfle tout le composant), déplacée par `offset` et agrandie au grab.
        HStack(spacing: 0) {
            ForEach(MemoryViewMode.allCases, id: \.self) { tab($0) }
        }
        .background(alignment: .leading) {
            GlassEffectContainer {
                Capsule()
                    .fill(.clear)
                    .frame(width: segmentWidth)
                    .glassEffect(.regular.tint(Palette.action).interactive(), in: .capsule)
                    .scaleEffect(pillScale)
                    // **Squash « jelly » au changement d'onglet** (façon barre iOS) : au moment
                    // où la bulle part de l'autre côté elle s'étire en X / s'écrase en Y, puis
                    // rebondit à 1 — c'est ce squash vertical qui porte le ressenti de bounce.
                    .keyframeAnimator(initialValue: PillSquash(), trigger: mode) { view, s in
                        view.scaleEffect(x: s.x, y: s.y, anchor: .center)
                    } keyframes: { _ in
                        KeyframeTrack(\.y) {
                            CubicKeyframe(squashY, duration: 0.13)
                            SpringKeyframe(1.0, duration: 0.34, spring: .bouncy)
                        }
                        KeyframeTrack(\.x) {
                            CubicKeyframe(stretchX, duration: 0.13)
                            SpringKeyframe(1.0, duration: 0.34, spring: .bouncy)
                        }
                    }
                    .offset(x: pillX)
            }
        }
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { innerWidth = $0 }
        .contentShape(Capsule())
        .gesture(grabGesture)
        .padding(4)
        .background(Palette.surfaceElevated, in: Capsule())
    }

    private func tab(_ m: MemoryViewMode) -> some View {
        Text(m.title)
            .font(MyndFont.font(size: 14, weight: .semibold))
            .foregroundStyle(mode == m ? .white : Palette.inkSoft)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 9)
        .contentShape(Rectangle())
        .allowsHitTesting(false)          // tout passe par le geste unique du conteneur
        .accessibilityElement()
        .accessibilityLabel(m.title)
        .accessibilityAddTraits(mode == m ? [.isButton, .isSelected] : .isButton)
        .accessibilityAction { withAnimation(settleAnimation) { mode = m } }
    }

    /// Geste **unique** copiant la sélection de la barre d'onglets : agrandissement au
    /// toucher (grab), suivi du doigt, bascule au milieu, calage avec bounce au relâché.
    /// `minimumDistance: 0` → réponse **dès le touch-down** (l'agrandissement immédiat de
    /// la navbar) ; un simple tap (sans mouvement) bascule sur l'onglet touché à `onEnded`.
    private var grabGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                let seg = segmentWidth
                guard seg > 0 else { return }
                if !grabbing { withAnimation(grabAnimation) { grabbing = true } }
                let x = min(max(value.location.x, 0), innerWidth)
                // Suit le doigt uniquement au-delà d'un vrai mouvement (sinon : tap immobile).
                if abs(value.translation.width) > 2 {
                    dragX = min(max(x - seg / 2, 0), seg)
                    let target: MemoryViewMode = x < innerWidth / 2 ? .list : .map
                    if target != mode { withAnimation(settleAnimation) { mode = target } }
                }
            }
            .onEnded { value in
                let target: MemoryViewMode = value.location.x < innerWidth / 2 ? .list : .map
                withAnimation(settleAnimation) {
                    mode = target
                    dragX = nil                       // se cale (bounce)
                }
                withAnimation(grabAnimation) { grabbing = false }   // redescend
            }
    }
}

/// Échelle bi-axiale de la bulle pour le squash « jelly » (`keyframeAnimator`).
private struct PillSquash {
    var x: CGFloat = 1
    var y: CGFloat = 1
}
