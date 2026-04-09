const cards = [
  {
    title: "Stop Blind Scheduling",
    body: "Are you giving the Friday night rush to a server who moves fast, but has bad tips? You could be losing hundreds of dollars in upsell revenue without knowing it.",
  },
  {
    title: "Know Exactly How to Coach",
    body: "When a server struggles, managers rarely know why. We tell you exactly if it is a speed problem, an upselling problem, or a guest connection problem.",
  },
  {
    title: "Keep Your Best Staff",
    body: "Elite servers often leave because their hard work goes unnoticed. Measure their success fairly and reward them with the best shifts so they never want to quit.",
  },
];

export default function PainPoints() {
  return (
    <section className="border-t border-shift-border bg-white py-20">
      <div className="mx-auto max-w-[1200px] px-5">
        {/* Header */}
        <div className="mb-15 text-center">
          <h2 className="mb-4 text-3xl font-bold text-shift-green md:text-[2.5rem]">
            Running a floor is hard enough.
          </h2>
          <p className="text-lg text-shift-text-light">
            POS systems give you messy numbers, not answers. Here is what we fix.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border-t-4 border-shift-brown bg-shift-offwhite px-8 py-10"
            >
              <h3 className="mb-4 text-2xl font-bold text-shift-text-dark">
                {card.title}
              </h3>
              <p className="text-lg leading-relaxed text-shift-text-light">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
