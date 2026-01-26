import { Container } from "@/components/layout/Container";
import { PostForm } from "@/components/post/PostForm";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { PostList } from "@/components/post/PostList";

export default function HomePage() {
  return (
    <Container>
      <div className="py-8">
        <PostForm />
        <div className="mt-8">
          <FeedTabs />
          <PostList />
        </div>
      </div>
    </Container>
  );
}
