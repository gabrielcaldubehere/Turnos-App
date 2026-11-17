type PendingPageProps = {
  title: string;
  description: string;
};

function PendingPage({ title, description }: PendingPageProps) {
  return (
    <section className="surface p-8 text-center">
      <p className="eyebrow">MÓDULO EN PREPARACIÓN</p>
      <h2 className="mt-2 text-2xl font-bold text-zinc-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-zinc-500">{description}</p>
    </section>
  );
}

export default PendingPage;
