/**
 * The scrolling clearance strip under the hero.
 *
 * Measured off the live theme: #f4efe9 ground, black 28px/900 text in the
 * system stack, the two phrases alternating as separate items, 20px vertical
 * padding on desktop (40px under 750px) and a 30s loop. The sequence is
 * duplicated so the -50% translate repeats seamlessly.
 */
const PHRASES = ["CLEARANCE SALE", "50-60% Off"];

const REPEATS = 5;

export function Marquee() {
  return (
    <div className="overflow-hidden bg-[#f4efe9] py-5 max-[750px]:py-10">
      <div className="marquee-track flex w-max">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0" aria-hidden={half === 1}>
            {Array.from({ length: REPEATS }, (_, i) => (
              <div key={i} className="flex shrink-0 items-center gap-24 pr-24">
                {PHRASES.map((phrase) => (
                  <b
                    key={phrase}
                    className="block text-[25px] leading-[30px] font-bold whitespace-nowrap text-black"
                  >
                    {phrase}
                  </b>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
