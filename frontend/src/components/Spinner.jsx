const styles = {
  wrapper: (fullPage) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(fullPage ? { minHeight: '100vh' } : { padding: '2rem' }),
  }),
  ring: {
    width: 36,
    height: 36,
    border: '3px solid var(--sand)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}

export default function Spinner({ fullPage = false, size = 36 }) {
  return (
    <div style={styles.wrapper(fullPage)}>
      <div style={{ ...styles.ring, width: size, height: size }} />
    </div>
  )
}
