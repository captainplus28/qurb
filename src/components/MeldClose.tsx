"use client";

/** "Sluiten" button on the meld-modal thank-you panel. Mirrors the original
 *  inline onclick that closed the overlay. */
export default function MeldClose() {
  return (
    <button
      type="button"
      id="meld-cancel2"
      className="meld-submit"
      onClick={() => {
        const ov = document.getElementById("meld-overlay");
        ov?.classList.remove("open");
        document.body.style.overflow = "";
      }}
    >
      Sluiten
    </button>
  );
}
