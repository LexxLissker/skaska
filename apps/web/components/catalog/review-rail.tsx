export function ReviewRail({
    reviews,
}: {
    reviews: Array<{ name: string; rating: string; text: string }>;
}) {
    return (
        <section className="pt-8">
            <h2 className="px-4 pb-3 font-heading text-[22px] font-medium">Отзывы</h2>
            <div className="noscroll flex gap-3 overflow-x-auto px-4 pb-1">
                {reviews.map(review => (
                    <article key={review.name} className="card w-[260px] shrink-0 p-4">
                        <div className="flex items-center gap-2.5">
                            <span
                                aria-hidden="true"
                                className="gold-circle h-7 w-7 text-[12px]"
                            >
                                {review.name[0]}
                            </span>
                            <div>
                                <p className="text-[13.5px] font-medium text-text">{review.name}</p>
                                <p className="font-heading text-[12px] text-accent-300">
                                    ★ {review.rating}
                                </p>
                            </div>
                        </div>
                        <p className="mt-2.5 text-[12.5px] leading-relaxed text-text/60">
                            {review.text}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}
