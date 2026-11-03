import { Link, useParams } from "react-router-dom";
import { posts } from "../data";
import { useTitle } from "../useTitle";

export function Blog() {
  useTitle("Journal");
  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">Blog</p>
        <h1 className="shop-title">Notes from the range and the desk.</h1>
        <div className="blog-grid">
          {posts.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-card">
              <img src={post.image} alt="" />
              <p className="eyebrow">{post.kicker}</p>
              <h2>{post.title}</h2>
              <p className="muted">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Post() {
  const { slug } = useParams();
  const post = posts.find((item) => item.slug === slug);
  useTitle(post ? post.title : "Journal");

  if (!post) {
    return (
      <section className="section">
        <div className="wrap narrow empty">
          <h1>That note has been pulled.</h1>
          <Link to="/blog" className="btn-lime">
            Back to the journal
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article className="section">
      <div className="wrap post">
        <Link to="/blog" className="text-link">
          Back to the journal
        </Link>
        <p className="eyebrow">
          {post.kicker} · {post.date}
        </p>
        <h1>{post.title}</h1>
        <img className="heroish" src={post.image} alt="" />
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
