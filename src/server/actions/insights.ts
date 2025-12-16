'use server'

import { db } from '@/server/db'
import { assertAuthenticated } from '@/server/utils'

import { HighlightsResponse, MilestonesResponse, Milestone, Highlight } from '@/types'

/**
 * Get milestones for the authenticated user's trees
 * @returns { Promise<MilestonesResponse> } Milestones data
 */
export async function getMilestones(): Promise<MilestonesResponse> {
  const userId = await assertAuthenticated()

  const trees = await db.tree.findMany({
    where: { accesses: { some: { userId } } },
    include: {
      nodes: {
        select: {
          id: true,
          fullName: true,
          birthDate: true,
          deathDate: true,
          treeId: true,
          taggedIn: {
            where: { isProfile: true },
            select: { picture: { select: { fileKey: true } } },
            take: 1,
          },
        },
      },
    },
  })

  const today = new Date()
  const todayMD = { month: today.getMonth(), day: today.getDate() }

  const allBirthdays: Milestone[] = []
  const allAnniversaries: Milestone[] = []

  trees.forEach((tree) => {
    tree.nodes.forEach((n) => {
      if (n.birthDate && !n.deathDate) {
        const bDate = new Date(n.birthDate)
        let nextBirthday = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate())
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1)

        const daysUntil = Math.ceil(
          (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntil >= 0 && daysUntil <= 240) {
          allBirthdays.push({
            id: n.id,
            name: n.fullName,
            treeName: tree.name,
            treeSlug: tree.slug,
            date: n.birthDate.toISOString().split('T')[0],
            age: today.getFullYear() - bDate.getFullYear(),
            picture: n.taggedIn[0]?.picture.fileKey || null,
            daysUntil,
          })
        }
      }

      if (n.birthDate) {
        const bDate = new Date(n.birthDate)
        if (bDate.getMonth() === todayMD.month && bDate.getDate() === todayMD.day) {
          allAnniversaries.push({
            id: n.id,
            name: n.fullName,
            treeName: tree.name,
            treeSlug: tree.slug,
            date: bDate.toISOString().split('T')[0],
            yearsAgo: today.getFullYear() - bDate.getFullYear(),
            picture: n.taggedIn[0]?.picture.fileKey || null,
            type: 'birth' as const,
          })
        }
      }

      if (n.deathDate) {
        const dDate = new Date(n.deathDate)
        if (dDate.getMonth() === todayMD.month && dDate.getDate() === todayMD.day) {
          allAnniversaries.push({
            id: n.id,
            name: n.fullName,
            treeName: tree.name,
            treeSlug: tree.slug,
            date: dDate.toISOString().split('T')[0],
            yearsAgo: today.getFullYear() - dDate.getFullYear(),
            picture: n.taggedIn[0]?.picture.fileKey || null,
            type: 'death' as const,
          })
        }
      }
    })
  })

  return {
    birthdays: allBirthdays.sort((a, b) => (a.day ?? 0) - (b.day ?? 0)),
    anniversaries: allAnniversaries.sort((a, b) => (b.yearsAgo ?? 0) - (a.yearsAgo ?? 0)),
  }
}
/**
 * Get highlights for the authenticated user's trees
 * @returns { Promise<HighlightsResponse> } Highlights data
 */
export async function getHighlights(): Promise<HighlightsResponse> {
  const userId = await assertAuthenticated()

  const trees = await db.tree.findMany({
    where: { accesses: { some: { userId } } },
    include: {
      nodes: { include: { taggedIn: true, edgesFrom: true, edgesTo: true } },
      Picture: true,
    },
  })
  let oldestAncestor: Highlight | null = null
  let newestMember: Highlight | null = null
  let mostPhotos: Highlight | null = null
  let largestBranch: Highlight | null = null

  trees.forEach((t) => {
    const treeOldest = t.nodes
      .filter((n) => n.birthDate)
      .sort((a, b) => new Date(a.birthDate!).getTime() - new Date(b.birthDate!).getTime())[0]
    if (
      treeOldest &&
      (!oldestAncestor ||
        new Date(treeOldest.birthDate!).getTime() < new Date(oldestAncestor.birthDate!).getTime())
    ) {
      oldestAncestor = {
        id: treeOldest.id,
        name: treeOldest.fullName,
        treeName: t.name,
        treeSlug: t.slug,
        birthDate: treeOldest.birthDate!.toISOString(),
        birthYear: new Date(treeOldest.birthDate!).getFullYear(),
        addedAt: treeOldest.createdAt.toISOString(),
      }
    }
    const treeNewest = t.nodes.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]

    if (
      treeNewest &&
      (!newestMember ||
        new Date(treeNewest.createdAt).getTime() > new Date(newestMember.addedAt!).getTime())
    ) {
      newestMember = {
        id: treeNewest.id,
        name: treeNewest.fullName,
        treeName: t.name,
        treeSlug: t.slug,
        addedAt: treeNewest.createdAt.toISOString(),
      }
    }
    const treeMostPhotos = t.nodes
      .map((n) => ({
        n,
        photoCount: n.taggedIn.length,
        treeName: t.name,
        treeSlug: t.slug,
      }))
      .filter((i) => i.photoCount > 0)
      .sort((a, b) => b.photoCount - a.photoCount)[0]

    if (
      treeMostPhotos &&
      (!mostPhotos || treeMostPhotos.photoCount > (mostPhotos.photoCount ?? 0))
    ) {
      mostPhotos = {
        id: treeMostPhotos.n.id,
        name: treeMostPhotos.n.fullName,
        treeName: t.name,
        treeSlug: t.slug,
        photoCount: treeMostPhotos.photoCount,
      }
    }
    const treeLargestBranch = t.nodes
      .map((n) => ({
        n,
        childrenCount: n.edgesFrom.filter((e) => e.type === 'PARENT').length,
        treeName: t.name,
        treeSlug: t.slug,
      }))
      .filter((i) => i.childrenCount > 0)
      .sort((a, b) => b.childrenCount - a.childrenCount)[0]
    if (
      treeLargestBranch &&
      (!largestBranch || treeLargestBranch.childrenCount > (largestBranch.childrenCount ?? 0))
    ) {
      largestBranch = {
        id: treeLargestBranch.n.id,
        name: treeLargestBranch.n.fullName,
        treeName: t.name,
        treeSlug: t.slug,
        childrenCount: treeLargestBranch.childrenCount,
      }
    }
  })
  return {
    oldest: oldestAncestor,
    newest: newestMember,
    largest: largestBranch,
    mostPhotos,
  }
}
