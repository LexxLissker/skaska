'use client';

import { useState } from 'react';

export function FaqAccordion({ items }: { items: Array<{ q: string; a: string }> }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="flex flex-col">
            {items.map((item, index) => {
                const open = openIndex === index;
                return (
                    <div key={item.q} className="border-b border-divider">
                        <button
                            type="button"
                            onClick={() => setOpenIndex(open ? null : index)}
                            aria-expanded={open}
                            className="flex w-full items-start justify-between gap-3 py-3.5 text-left"
                        >
                            <span className="text-[14px] leading-snug text-text">{item.q}</span>
                            <span
                                aria-hidden="true"
                                className="mt-0.5 shrink-0 font-heading text-[18px] leading-none text-accent"
                            >
                                {open ? '−' : '+'}
                            </span>
                        </button>
                        {open && (
                            <p className="pb-3.5 text-[13px] leading-relaxed text-text/60">
                                {item.a}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
