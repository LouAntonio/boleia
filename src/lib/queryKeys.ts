export const tripKeys = {
	all: ['trips'] as const,
	lists: () => [...tripKeys.all, 'list'] as const,
	list: (filters: Record<string, unknown>) =>
		[...tripKeys.lists(), filters] as const,
	details: () => [...tripKeys.all, 'detail'] as const,
	detail: (id: string) => [...tripKeys.details(), id] as const,
	events: (id: string) => [...tripKeys.all, 'events', id] as const,
};
