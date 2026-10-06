export default function GaneshaLogo({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Crown / Mukut crest */}
      <path
        d="M10 2.5L12 1.5L14 2.5V5H10V2.5Z"
        fill="currentColor"
        opacity="0.95"
      />
      {/* Sacred Tilak mark */}
      <path
        d="M12 4.5V8.2M10.8 6.5C11.5 7 12.5 7 13.2 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Left and Right Ears / Head curve */}
      <path
        d="M8.5 5.5C5.8 5.8 4 7.5 4 10.2C4 12.5 5.5 13.8 7.5 14.2M15.5 5.5C18.2 5.8 20 7.5 20 10.2C20 12.5 18.5 13.8 16.5 14.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* Trunk graceful curve */}
      <path
        d="M10 9C10.5 11 11.2 13 11 15C10.7 17.5 8.5 18.5 9 20C9.4 21.2 11.2 21.5 12.2 20.8C13.5 19.8 14 17.5 14 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Modak symbol */}
      <circle cx="8" cy="18" r="1.2" fill="currentColor" />
    </svg>
  );
}
