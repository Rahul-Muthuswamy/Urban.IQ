import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import CommunityHeader from "../CommunityHeader.jsx";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("CommunityHeader", () => {
  const mockCommunity = {
    id: 1,
    name: "t/testcommunity",
    title: "Test Community",
    description: "This is a test community",
    logo: "https://example.com/logo.png",
    banner_url: "https://example.com/banner.jpg",
    subscriberCount: 1000,
    PostsCount: 50,
    CommentsCount: 200,
    has_subscribed: false,
  };

  it("renders community title and name", () => {
    render(<CommunityHeader community={mockCommunity} />, { wrapper: createWrapper() });

    expect(screen.getByText("Test Community")).toBeInTheDocument();
    expect(screen.getByText(/r\/testcommunity/i)).toBeInTheDocument();
  });

  it("displays community stats", () => {
    render(<CommunityHeader community={mockCommunity} />, { wrapper: createWrapper() });

    expect(screen.getByText(/1K/i)).toBeInTheDocument(); // subscriberCount
    expect(screen.getByText(/50/i)).toBeInTheDocument(); // PostsCount
    expect(screen.getByText(/200/i)).toBeInTheDocument(); // CommentsCount
  });

  it("shows Join button when not subscribed", () => {
    render(<CommunityHeader community={mockCommunity} />, { wrapper: createWrapper() });

    expect(screen.getByText("Join")).toBeInTheDocument();
  });

  it("shows Joined button when subscribed", () => {
    const subscribedCommunity = { ...mockCommunity, has_subscribed: true };
    render(<CommunityHeader community={subscribedCommunity} />, { wrapper: createWrapper() });

    expect(screen.getByText("Joined")).toBeInTheDocument();
  });

  it("displays community description when available", () => {
    render(<CommunityHeader community={mockCommunity} />, { wrapper: createWrapper() });

    expect(screen.getByText("This is a test community")).toBeInTheDocument();
  });

  it("renders logo when available", () => {
    render(<CommunityHeader community={mockCommunity} />, { wrapper: createWrapper() });

    const logo = screen.getByAltText("Test Community");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "https://example.com/logo.png");
  });

  it("renders fallback logo when logo is not available", () => {
    const communityWithoutLogo = { ...mockCommunity, logo: null };
    render(<CommunityHeader community={communityWithoutLogo} />, { wrapper: createWrapper() });

    // Should render a div with initial letter
    expect(screen.getByText("T")).toBeInTheDocument();
  });
});


