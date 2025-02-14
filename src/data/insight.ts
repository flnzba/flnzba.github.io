import { type CollectionEntry, getCollection } from "astro:content";
import { siteConfig } from "@/site-config";

/** filter out draft insights based on the environment */
export async function getAllInsights() {
	return await getCollection("insight", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

/** returns the date of the insight based on option in siteConfig.sortInsightsByUpdatedDate */
export function getProjectSortDate(insight: CollectionEntry<"insight">) {
	return siteConfig.sortPostsByUpdatedDate && insight.data.updatedDate !== undefined
		? new Date(insight.data.updatedDate)
		: new Date(insight.data.publishDate);
}

/** sort insight by date (by siteConfig.sortInsightsByUpdatedDate), desc.*/
export function sortMDByDate(insights: CollectionEntry<"insight">[]) {
	return insights.sort((b, a) => {
		const aDate = getProjectSortDate(a).valueOf();
		const bDate = getProjectSortDate(b).valueOf();
		return aDate - bDate;
	});
}

/** groups insights by year (based on option siteConfig.sortInsightsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft insights, pass it the result of getAllInsights above to do so.
 */
export function groupInsightsByYear(insights: CollectionEntry<"insight">[]) {
	return insights.reduce<Record<string, CollectionEntry<"insight">[]>>((acc, insight) => {
		const year = getProjectSortDate(insight).getFullYear();
		if (!acc[year]) {
			acc[year] = [];
		}
		acc[year]?.push(insight);
		return acc;
	}, {});
}

/** returns all tags created from insights (inc duplicate tags)
 *  Note: This function doesn't filter draft insights, pass it the result of getAllInsights above to do so.
 *  */
export function getAllTags(insights: CollectionEntry<"insight">[]) {
	return insights.flatMap((insight) => [...insight.data.tags]);
}

/** returns all unique tags created from insights
 *  Note: This function doesn't filter draft insights, pass it the result of getAllInsights above to do so.
 *  */
export function getUniqueTags(insights: CollectionEntry<"insight">[]) {
	return [...new Set(getAllTags(insights))];
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft insights, pass it the result of getAllInsights above to do so.
 *  */
export function getUniqueTagsWithCount(insights: CollectionEntry<"insight">[]): [string, number][] {
	return [
		...getAllTags(insights).reduce(
			(acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}
