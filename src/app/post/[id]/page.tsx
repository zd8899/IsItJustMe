import { Container } from "@/components/layout/Container";
import { PostDetail } from "@/components/post/PostDetail";

interface PostPageProps {
  params: { id: string };
}

export default function PostPage({ params }: PostPageProps) {
  return (
    <Container>
      <div className="py-8">
        <PostDetail postId={params.id} />
      </div>
    </Container>
  );
}
