import { type CollectionEntry, getCollection } from "astro:content";
import { siteConfig } from "@/site-config";

/** filter out draft projects based on the environment */
export async function getAllProjects() {
	return await getCollection("project", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

/** returns the date of the project based on option in siteConfig.sortProjectsByUpdatedDate */
export function getProjectSortDate(project: CollectionEntry<"project">) {
	return siteConfig.sortPostsByUpdatedDate && project.data.updatedDate !== undefined
		? new Date(project.data.updatedDate)
		: new Date(project.data.publishDate);
}

/** sort project by date (by siteConfig.sortProjectsByUpdatedDate), desc.*/
export function sortMDByDate(projects: CollectionEntry<"project">[]) {
	return projects.sort((b, a) => {
		const aDate = getProjectSortDate(a).valueOf();
		const bDate = getProjectSortDate(b).valueOf();
		return aDate - bDate;
	});
}

/** groups projects by year (based on option siteConfig.sortProjectsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 */
export function groupProjectsByYear(projects: CollectionEntry<"project">[]) {
	return projects.reduce<Record<string, CollectionEntry<"project">[]>>((acc, project) => {
		const year = getProjectSortDate(project).getFullYear();
		if (!acc[year]) {
			acc[year] = [];
		}
		acc[year]?.push(project);
		return acc;
	}, {});
}

/** returns all tags created from projects (inc duplicate tags)
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getAllTags(projects: CollectionEntry<"project">[]) {
	return projects.flatMap((project) => [...project.data.tags]);
}

/** returns all unique tags created from projects
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getUniqueTags(projects: CollectionEntry<"project">[]) {
	return [...new Set(getAllTags(projects))];
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getUniqueTagsWithCount(projects: CollectionEntry<"project">[]): [string, number][] {
	return [
		...getAllTags(projects).reduce(
			(acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}
