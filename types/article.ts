export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  category: string;
  readTime: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishDate: string;
  tags: string[];
  isFavorite: boolean;
  isBookmarked: boolean;
  viewCount: number;
  shareCount: number;
  relatedArticleIds: string[];
}
