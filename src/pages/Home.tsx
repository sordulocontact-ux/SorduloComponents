import ComponentCard from '../components/ComponentCard';
import { components } from '../showcase/registry';

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[var(--layout-max-width)] px-6 pb-24 pt-16 sm:px-12 sm:pt-[90px]">
      <div className="flex flex-col gap-10">
        <div className="flex max-w-[410px] flex-col gap-2">
          <h1 className="font-display text-display text-foreground">
            Sordulo components
          </h1>
          <p className="text-label text-subtle">
            A collection of interface moments, sounds, and principles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {components.map((item) => (
            <ComponentCard
              key={item.id}
              name={item.name}
              description={item.description}
              platforms={item.platforms}
            >
              {item.preview}
            </ComponentCard>
          ))}
        </div>
      </div>
    </main>
  );
}
