'use server'

import { db } from '@/server/db'
import { assertAuthenticated, calculateDaysUntil } from '@/server/utils'

import {
  HighlightsResponse,
  MilestonesResponse,
  Milestone,
  Highlight,
  TreeNode,
  Tree,
} from '@/types'

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
            select: {
              isProfile: true,
              picture: { select: { fileKey: true, date: true, tags: true } },
            },
          },
        },
      },
    },
  })

  const today = new Date()
  const todayMD = { month: today.getMonth(), day: today.getDate() }

  const birthdays: Milestone[] = []
  const anniversaries: Milestone[] = []
  const memories: Milestone[] = []

  const addedPics = new Set<string>()

  const _getProfilePic = (node: TreeNode) => node.taggedIn?.find((tag) => tag.isProfile)?.picture
  const _getNodeName = (tree: Tree, nodeId: string) =>
    tree.nodes?.find((n) => n.id === nodeId)?.fullName || null

  const _addBirthday = (tree: Tree, node: TreeNode, birthDate: Date) => {
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
    if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1)
    const daysUntil = calculateDaysUntil(nextBirthday)

    if (daysUntil >= 0 && daysUntil <= 30) {
      birthdays.push({
        id: node.id,
        name: node.fullName,
        treeName: tree.name,
        treeSlug: tree.slug,
        date: birthDate.toISOString().split('T')[0],
        age: today.getFullYear() - birthDate.getFullYear() + (daysUntil === 0 ? 0 : 1),
        picture: _getProfilePic(node)?.fileKey || null,
        daysUntil,
      })
    }
  }

  const _addAnniversary = (tree: Tree, node: TreeNode, date: Date, type: 'birth' | 'death') => {
    if (date.getMonth() === todayMD.month && date.getDate() === todayMD.day) {
      anniversaries.push({
        id: node.id,
        name: node.fullName,
        treeName: tree.name,
        treeSlug: tree.slug,
        date: date.toISOString().split('T')[0],
        yearsAgo: today.getFullYear() - date.getFullYear(),
        picture: _getProfilePic(node)?.fileKey || null,
        type,
      })
    }
  }

  const _addMemories = (tree: Tree, node: TreeNode) => {
    node.taggedIn?.forEach((tag) => {
      const pic = tag.picture
      if (!pic?.date || addedPics.has(pic.fileKey)) return

      const taken = new Date(pic.date)
      if (taken.getMonth() === todayMD.month /* && taken.getDate() === todayMD.day */) {
        const allNames = pic.tags
          ?.map((t) => _getNodeName(tree, t.nodeId))
          .filter((n): n is string => !!n)

        memories.push({
          id: node.id,
          name: allNames && allNames.length > 0 ? allNames.join(', ') : node.fullName,
          treeName: tree.name,
          treeSlug: tree.slug,
          picture: pic.fileKey,
          yearsAgo: today.getFullYear() - taken.getFullYear(),
          date: taken.toISOString().split('T')[0],
        })
        addedPics.add(pic.fileKey)
      }
    })
  }

  trees.forEach((tree) => {
    tree.nodes?.forEach((node) => {
      const birthDate = node.birthDate ? new Date(node.birthDate) : null
      const deathDate = node.deathDate ? new Date(node.deathDate) : null

      if (birthDate && !deathDate) _addBirthday(tree as Tree, node as TreeNode, birthDate)
      if (birthDate) _addAnniversary(tree as Tree, node as TreeNode, birthDate, 'birth')
      if (deathDate) _addAnniversary(tree as Tree, node as TreeNode, deathDate, 'death')
      _addMemories(tree as Tree, node as TreeNode)
    })
  })

  return {
    birthdays: birthdays.sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0)),
    anniversaries: anniversaries.sort((a, b) => (b.yearsAgo ?? 0) - (a.yearsAgo ?? 0)),
    memories: memories.sort((a, b) => (b.yearsAgo ?? 0) - (a.yearsAgo ?? 0)),
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
      nodes: {
        include: {
          edgesFrom: true,
          edgesTo: true,
          taggedIn: {
            select: { id: true, isProfile: true, picture: { select: { fileKey: true } } },
          },
        },
      },
    },
  })

  let oldestAncestor: Highlight | null = null
  let newestMember: Highlight | null = null
  let mostPhotos: Highlight | null = null
  let mostChildren: Highlight | null = null

  trees.forEach((t) => {
    const oldest = t.nodes
      .filter((n) => n.birthDate)
      .sort((a, b) => new Date(a.birthDate!).getTime() - new Date(b.birthDate!).getTime())[0]
    if (
      oldest &&
      (!oldestAncestor ||
        new Date(oldest.birthDate!).getTime() < new Date(oldestAncestor.birthDate!).getTime())
    ) {
      const picture = oldest.taggedIn.find((tag) => tag.isProfile)?.picture
      oldestAncestor = {
        id: oldest.id,
        name: oldest.fullName,
        treeName: t.name,
        treeSlug: t.slug,
        picture: picture?.fileKey,
        birthDate: oldest.birthDate!.toISOString(),
        birthYear: new Date(oldest.birthDate!).getFullYear(),
        addedAt: oldest.createdAt.toISOString(),
      }
    }
    const youngest = t.nodes.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]

    if (
      youngest &&
      (!newestMember ||
        new Date(youngest.createdAt).getTime() > new Date(newestMember.addedAt!).getTime())
    ) {
      const picture = youngest.taggedIn.find((tag) => tag.isProfile)?.picture
      newestMember = {
        id: youngest.id,
        name: youngest.fullName,
        treeName: t.name,
        treeSlug: t.slug,
        picture: picture?.fileKey,
        addedAt: youngest.createdAt.toISOString(),
      }
    }
    const mostPictures = t.nodes
      .map((n) => ({
        n,
        photoCount: n.taggedIn.length,
        treeName: t.name,
        treeSlug: t.slug,
        picture: n.taggedIn.find((tag) => tag.isProfile)?.picture?.fileKey,
      }))
      .filter((i) => i.photoCount > 0)
      .sort((a, b) => b.photoCount - a.photoCount)[0]

    if (mostPictures && (!mostPhotos || mostPictures.photoCount > (mostPhotos.photoCount ?? 0))) {
      mostPhotos = {
        id: mostPictures.n.id,
        name: mostPictures.n.fullName,
        treeName: t.name,
        treeSlug: t.slug,
        photoCount: mostPictures.photoCount,
        picture: mostPictures?.picture,
      }
    }
    const largestBranch = t.nodes
      .map((n) => ({
        n,
        childrenCount: n.edgesFrom.filter((e) => e.type === 'PARENT').length,
        treeName: t.name,
        treeSlug: t.slug,
        picture: n.taggedIn.find((tag) => tag.isProfile)?.picture?.fileKey,
      }))
      .filter((i) => i.childrenCount > 0)
      .sort((a, b) => b.childrenCount - a.childrenCount)[0]
    if (
      largestBranch &&
      (!mostChildren || largestBranch.childrenCount > (mostChildren.childrenCount ?? 0))
    ) {
      mostChildren = {
        id: largestBranch.n.id,
        name: largestBranch.n.fullName,
        treeName: t.name,
        treeSlug: t.slug,
        childrenCount: largestBranch.childrenCount,
        picture: largestBranch?.picture,
      }
    }
  })
  return {
    oldest: oldestAncestor,
    newest: newestMember,
    largest: mostChildren,
    mostPhotos,
  }
}
