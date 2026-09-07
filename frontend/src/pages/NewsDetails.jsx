import { Link, useParams } from "react-router-dom";
import "../styles/realestate.css";
import { getNewsById, default as newsList } from "../data/news";
import { formatDate } from "../utils/formatPrice";

export default function NewsDetails() {
  const { id } = useParams();
  const article = getNewsById(id);

  if (!article) {
    return (
      <div className="re-scope">
        <div className="container re-empty">
          <div className="re-empty-icon">
            <i className="bi bi-newspaper" aria-hidden="true" />
          </div>
          <h3>الخبر غير موجود</h3>
          <p>لم نتمكن من العثور على الخبر المطلوب.</p>
          <Link to="/news" className="re-btn re-btn-primary">
            كل الأخبار
          </Link>
        </div>
      </div>
    );
  }

  const related = newsList.filter((item) => item.id !== article.id).slice(0, 3);

  return (
    <div className="re-scope news-details-page">
      <article className="container news-article">
        <header className="news-article-header">
          <Link to="/news" className="project-back-link">
            <i className="bi bi-arrow-right" aria-hidden="true" /> كل الأخبار
          </Link>
          <span className="news-article-date">
            <i className="bi bi-calendar3" aria-hidden="true" /> {formatDate(article.date)}
          </span>
          <h1>{article.title}</h1>
          <p className="news-article-summary">{article.summary}</p>
        </header>

        <div className="news-article-image">
          <img src={article.image} alt={article.title} loading="lazy" />
        </div>

        <div className="news-article-body">
          {article.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="container news-related-section">
          <div className="search-results-heading">
            <h2>أخبار ذات صلة</h2>
          </div>
          <div className="row g-4">
            {related.map((item) => (
              <div className="col-md-4" key={item.id}>
                <Link to={`/news/${item.id}`} className="news-related-card">
                  <div className="news-related-image">
                    <img src={item.image} alt={item.title} loading="lazy" />
                  </div>
                  <div className="news-related-body">
                    <span>{formatDate(item.date)}</span>
                    <h3>{item.title}</h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
