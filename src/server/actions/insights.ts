'use server'

import * as Sentry from '@sentry/nextjs'

import { db } from '@/server/db'
import { assertAuthenticated, calculateDaysUntil, isInCurrentWeekOfYear } from '@/server/utils'

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
  try {
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
    today.setHours(0, 0, 0, 0)

    const birthdays: Milestone[] = []
    const anniversaries: Milestone[] = []
    const memories: Milestone[] = []

    const addedPics = new Set<string>()

    const _getProfilePic = (node: TreeNode) => node.taggedIn?.find((tag) => tag.isProfile)?.picture
    const _getNodeName = (tree: Tree, nodeId: string) =>
      tree.nodes?.find((n) => n.id === nodeId)?.fullName || null

    const _addBirthday = (tree: Tree, node: TreeNode, birthDate: Date) => {
      let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      if (
        birthDate.getMonth() === 1 &&
        birthDate.getDate() === 29 &&
        nextBirthday.getMonth() !== 1
      ) {
        nextBirthday = new Date(today.getFullYear(), 1, 28)
      }
      nextBirthday.setHours(0, 0, 0, 0)
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1)
      const daysUntil = Math.round(
        (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntil >= 0 && daysUntil <= 30) {
        birthdays.push({
          id: node.id,
          name: node.fullName,
          treeName: tree.name,
          treeSlug: tree.slug,
          date: birthDate.toISOString().split('T')[0],
          age: nextBirthday.getFullYear() - birthDate.getFullYear(),
          picture: _getProfilePic(node)?.fileKey || null,
          daysUntil,
        })
      }
    }

    const _addAnniversary = (tree: Tree, node: TreeNode, date: Date, type: 'birth' | 'death') => {
      const daysUntil = calculateDaysUntil(date, { ignoreYear: true })
      if (daysUntil >= 0 && daysUntil <= 30) {
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

        if (isInCurrentWeekOfYear(taken)) {
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
  } catch (e) {
    Sentry.captureException(e, { tags: { action: 'getMilestones' } })
    return { birthdays: [], anniversaries: [], memories: [] }
  }
}

/**
 * Get highlights for the authenticated user's trees
 * @returns { Promise<HighlightsResponse> } Highlights data
 */
export async function getHighlights(): Promise<HighlightsResponse> {
  try {
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
    let youngestAncestor: Highlight | null = null
    let mostPhotos: Highlight | null = null
    let mostChildren: Highlight | null = null
    let mostMembers: Highlight | null = null

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
          gender: oldest.gender,
          treeName: t.name,
          treeSlug: t.slug,
          picture: picture?.fileKey,
          birthDate: oldest.birthDate!.toISOString(),
          birthYear: new Date(oldest.birthDate!).getFullYear(),
          addedAt: oldest.createdAt.toISOString(),
        }
      }
      const youngest = t.nodes.sort(
        (a, b) => new Date(b.birthDate!).getTime() - new Date(a.birthDate!).getTime()
      )[0]

      if (
        youngest &&
        (!youngestAncestor ||
          new Date(youngest.birthDate!).getTime() > new Date(youngestAncestor.birthDate!).getTime())
      ) {
        const picture = youngest.taggedIn.find((tag) => tag.isProfile)?.picture
        youngestAncestor = {
          id: youngest.id,
          name: youngest.fullName,
          treeName: t.name,
          treeSlug: t.slug,
          picture: picture?.fileKey,
          birthDate: youngest.birthDate!.toISOString(),
          birthYear: new Date(youngest.birthDate!).getFullYear(),
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

    if (trees.length > 0) {
      const largestTree = trees.sort((a, b) => b.nodes.length - a.nodes.length)[0]
      if (largestTree.nodes.length > 0) {
        const randomMember = largestTree.nodes[Math.floor(Math.random() * largestTree.nodes.length)]
        const picture = randomMember.taggedIn.find((tag) => tag.isProfile)?.picture

        mostMembers = {
          id: largestTree.id,
          name: largestTree.name,
          treeName: largestTree.name,
          treeSlug: largestTree.slug,
          memberCount: largestTree.nodes.length,
          picture: picture?.fileKey,
        }
      }
    }

    return {
      oldest: oldestAncestor,
      youngest: youngestAncestor,
      largest: mostChildren,
      mostPhotos,
      mostMembers,
    }
  } catch (e) {
    Sentry.captureException(e, { tags: { action: 'getHighlights' } })
    return { oldest: null, youngest: null, largest: null, mostPhotos: null, mostMembers: null }
  }
}
