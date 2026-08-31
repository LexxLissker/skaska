export function ReviewRail({
    reviews,
}: {
    reviews: Array<{ name: string; rating: string; text: string }>;
}) {
    return (
        <section className="pt-[22px]">
            <h2 className="px-4 pb-3 font-heading text-[22px] font-medium">Отзывы</h2>
            <div className="noscroll flex gap-3 overflow-x-auto px-4 pb-1">
                {reviews.map(review => (
                    <article key={review.name} className="panel w-[220px] shrink-0 p-[14px]">
                        <div className="flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="gold-circle h-7 w-7 text-[12px]"
                            >
                                {review.name[0]}
                            </span>
                            <div>
                                <p className="text-[13px] text-text">{review.name}</p>
                                <p className="font-heading text-[11px] text-accent-300">
                                    ★ {review.rating}
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-[12.5px] leading-[1.45] text-text/80">
                            {review.text}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}
