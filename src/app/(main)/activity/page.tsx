"use client";

const activity = [
  { id: 1, action: "Minted", name: "Blue Robot #001", time: "2m ago" },
  { id: 2, action: "Sold", name: "Ordinal Ape #18", time: "11m ago" },
  { id: 3, action: "Listed", name: "Photon Bloom", time: "28m ago" },
  { id: 4, action: "Inscribed", name: "Hash Relic", time: "1h ago" },
];

export default function ActivityPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-headings font-bold">Recent Activity</h1>
      <p className="mt-2 text-text-secondary">Live activity across the network.</p>

      <div className="mt-8 rounded-2xl border border-border bg-surface divide-y divide-border-subtle overflow-hidden">
        {activity.map((item) => (
          <div key={item.id} className="px-4 py-4 flex items-center justify-between hover:bg-bg-elevated transition-colors">
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-text-tertiary">{item.action}</div>
            </div>
            <div className="text-sm text-text-tertiary">{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
