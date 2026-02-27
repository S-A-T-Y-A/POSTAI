
import React from 'react';
import { Post, PostType } from '../types';
import { Type, Image, Film, BookImage } from 'lucide-react';

interface HistoryProps {
    posts: Post[];
    onSelectPost: (post: Post) => void;
}

const PostTypeIcon = ({ type }: { type: PostType }) => {
    switch (type) {
        case PostType.TEXT:
            return <Type className="h-5 w-5 text-brand-primary" />;
        case PostType.IMAGE:
            return <Image className="h-5 w-5 text-brand-primary" />;
        case PostType.VIDEO:
            return <Film className="h-5 w-5 text-brand-primary" />;
        case PostType.STORY:
            return <BookImage className="h-5 w-5 text-brand-primary" />;
        default:
            return null;
    }
};

export const History: React.FC<HistoryProps> = ({ posts, onSelectPost }) => {
    return (
        <div className="space-y-3">
            {posts.map((post) => (
                <div
                    key={post.id}
                    onClick={() => onSelectPost(post)}
                    className="flex items-center justify-between p-4 bg-brand-surface border border-brand-border rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:border-brand-primary hover:shadow-lg hover:shadow-brand-primary/10 hover:-translate-y-1"
                    aria-label={`View post: ${post.prompt}`}
                >
                    <div className="flex items-center space-x-4 min-w-0">
                        <PostTypeIcon type={post.type} />
                        <p className="text-brand-text truncate font-medium flex-1">{post.prompt}</p>
                    </div>
                    <span className="text-xs text-brand-text-secondary whitespace-nowrap ml-4">
                        {post.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ))}
        </div>
    );
};
