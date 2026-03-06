export default function Faqs() {
  return (
    <div className="page-shell">
      <section className="panel">
        <h2 className="page-title">FAQs</h2>
        <div className="faq-list">
          <div>
            <strong>Who can create books?</strong>
            <p>Only ADMIN users can create, update, and delete book records.</p>
          </div>
          <div>
            <strong>Who can borrow books?</strong>
            <p>Authenticated users can borrow books when copies are available.</p>
          </div>
          <div>
            <strong>How is login handled?</strong>
            <p>The backend stores a JWT in an HTTP-only cookie and the frontend revalidates with the profile route.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
