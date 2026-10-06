// Button text for table rows. On medium-wide screens (1024–1279px) only the icon shows,
// to leave room for the other columns; the word appears from 1280px.
// Screen readers always hear the full label, e.g. "Edit Snacks".
export default function ActionLabel({ text, title }) {
  return (
    <>
      <span className="hidden xl:inline">{text}</span>
      <span className="sr-only">
        <span className="xl:hidden">{text}</span> {title}
      </span>
    </>
  )
}
