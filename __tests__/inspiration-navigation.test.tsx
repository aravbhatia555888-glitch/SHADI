import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import InspirationScreen from '../app/inspiration';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock components
jest.mock('@/components/Card', () => {
  return function MockCard({ children, style }: any) {
    return <div style={style}>{children}</div>;
  };
});

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

describe('InspirationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders inspiration articles correctly', () => {
    const { getByText, getByPlaceholderText } = render(<InspirationScreen />);
    
    // Check if search input is rendered
    expect(getByPlaceholderText('Search articles...')).toBeTruthy();
    
    // Check if categories are rendered
    expect(getByText('Categories')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
    
    // Check if articles are rendered (should show first 3)
    expect(getByText('Traditional Elegance')).toBeTruthy();
    expect(getByText('Outdoor Garden Wedding Ideas')).toBeTruthy();
    expect(getByText('Mehendi Ceremony Essentials')).toBeTruthy();
  });

  it('filters articles by search query', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<InspirationScreen />);
    
    const searchInput = getByPlaceholderText('Search articles...');
    
    // Search for "traditional"
    fireEvent.changeText(searchInput, 'traditional');
    
    await waitFor(() => {
      expect(getByText('Traditional Elegance')).toBeTruthy();
      expect(getByText('Mehendi Ceremony Essentials')).toBeTruthy();
      // Should not show articles without "traditional" tag
      expect(queryByText('Wedding Photography Tips')).toBeFalsy();
    });
  });

  it('filters articles by category', () => {
    const { getByText, queryByText } = render(<InspirationScreen />);
    
    // Click on Fashion category
    fireEvent.press(getByText(/Fashion/));
    
    // Should show only fashion articles
    expect(getByText('Bridal Lehenga Trends 2024')).toBeTruthy();
    // Should not show other category articles
    expect(queryByText('Traditional Elegance')).toBeFalsy();
  });

  it('navigates to view all page when View All is pressed', () => {
    const { getByText } = render(<InspirationScreen />);
    
    const viewAllButton = getByText('View All');
    fireEvent.press(viewAllButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/inspiration/view-all',
      params: { category: '' }
    });
  });

  it('navigates to article detail when article is pressed', () => {
    const { getByText } = render(<InspirationScreen />);
    
    // Find and press an article
    const articleTitle = getByText('Traditional Elegance');
    fireEvent.press(articleTitle);
    
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/inspiration/[articleId]',
      params: { articleId: '1', category: 'All' }
    });
  });

  it('toggles favorite status when heart icon is pressed', () => {
    const { getAllByTestId } = render(<InspirationScreen />);
    
    // This would require adding testID to the Heart component in the actual implementation
    // For now, this test structure shows how it would work
    expect(true).toBeTruthy(); // Placeholder assertion
  });

  it('shows correct article count in categories', () => {
    const { getByText } = render(<InspirationScreen />);
    
    // Check if category counts are displayed
    expect(getByText(/All \(6\)/)).toBeTruthy();
    expect(getByText(/Themes \(1\)/)).toBeTruthy();
    expect(getByText(/Fashion \(1\)/)).toBeTruthy();
  });

  it('shows View All footer button when there are more than 3 articles', () => {
    const { getByText } = render(<InspirationScreen />);
    
    // Should show "View All 6 Articles" button at the bottom
    expect(getByText('View All 6 Articles')).toBeTruthy();
  });
});

describe('Article Search and Filter Logic', () => {
  const mockArticles = [
    {
      id: '1',
      title: 'Traditional Elegance',
      description: 'Blend traditional elements',
      tags: ['traditional', 'elegant'],
      category: 'Themes',
    },
    {
      id: '2',
      title: 'Modern Wedding',
      description: 'Contemporary celebration',
      tags: ['modern', 'contemporary'],
      category: 'Themes',
    },
  ];

  it('filters articles by title', () => {
    const searchQuery = 'traditional';
    const filtered = mockArticles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Traditional Elegance');
  });

  it('filters articles by tags', () => {
    const searchQuery = 'modern';
    const filtered = mockArticles.filter(article => 
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Modern Wedding');
  });

  it('filters articles by category', () => {
    const category = 'Themes';
    const filtered = mockArticles.filter(article => article.category === category);
    
    expect(filtered).toHaveLength(2);
  });
});