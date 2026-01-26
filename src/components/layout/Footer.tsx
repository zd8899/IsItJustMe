export function Footer() {
  return (
    <footer className="border-t border-primary-200 bg-white py-6 mt-12">
      <div className="max-w-4xl mx-auto px-4 text-center text-primary-500 text-sm">
        <p>&copy; {new Date().getFullYear()} IsItJustMe. All rights reserved.</p>
      </div>
    </footer>
  );
}
