export interface Post {
	slug: string;
	data: {
		title: string;
		tags: string[];
		category?: string | null;
		published: Date;
	};
}

export interface TimelineGroup {
	year: number;
	posts: Post[];
}

/**
 * 将文章按年份分组并排序，生成时间轴数据
 * @param posts 文章列表
 * @returns 按年份分组并排序的时间轴数据（年份从新到旧）
 */
export function groupPostsByYear(posts: Post[]): TimelineGroup[] {
	// 按年份分组
	const grouped = posts.reduce(
		(acc, post) => {
			const year = post.data.published.getFullYear();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	// 转换为数组格式
	const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
		year: Number.parseInt(yearStr, 10),
		posts: grouped[Number.parseInt(yearStr, 10)],
	}));

	// 按年份从新到旧排序
	groupedPostsArray.sort((a, b) => b.year - a.year);

	// 每个年份内的文章按日期从新到旧排序
	groupedPostsArray.forEach((group) => {
		group.posts.sort((a, b) => {
			const dateA = new Date(a.data.published);
			const dateB = new Date(b.data.published);
			return dateB.getTime() - dateA.getTime();
		});
	});

	return groupedPostsArray;
}
