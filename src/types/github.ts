// GitHub API response types
export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    private: boolean;
    owner: {
        login: string;
        id: number;
    };
    created_at: string;
    updated_at: string;
    pushed_at: string;
    size: number;
    default_branch: string;
}

export interface GitHubContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: 'file' | 'dir';
    content?: string;
    encoding?: string;
}