const steps = [
  {
    number: 1,
    title: "Export",
    body: "Download the weekly Server Summary CSV file right from your Toast POS dashboard.",
  },
  {
    number: 2,
    title: "Drop",
    body: "Drag and drop the file into your Shift-Engine interface. We instantly clean the messy data.",
  },
  {
    number: 3,
    title: "Lead",
    body: "Get instant scorecards and 1-minute coaching plans for your entire floor staff.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-shift-offwhite py-20 text-center">
      <div className="mx-auto max-w-[1200px] px-5">
        {/* Header */}
        <div className="mb-15 text-center">
          <h2 className="mb-4 text-3xl font-bold text-shift-green md:text-[2.5rem]">
            How it works
          </h2>
          <p className="text-lg text-shift-text-light">
            No complicated setup. No IT department required.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-10 flex flex-col items-center gap-5 md:flex-row md:justify-center">
          {steps.map((step) => (
            <div
              key={step.number}
              className="w-full max-w-[400px] rounded-lg border border-shift-border bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.02)] md:w-[30%]"
            >
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-shift-green text-lg font-bold text-white">
                {step.number}
              </div>
              <h3 className="mb-2 text-xl font-bold text-shift-green">
                {step.title}
              </h3>
              <p className="text-base text-shift-text-light">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
