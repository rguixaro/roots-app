'use server'

import { db } from '@/server/db'

import { sendWeeklyNewsletter } from '@/lib/email'

import { languageToLocale } from '@/utils/language'

interface NewsletterResult {
  success: boolean
  emailsSent: number
  errors: number
}

/**
 * Send Weekly Newsletters to users subscribed to newsletters.
 * @returns {Promise<NewsletterResult>} - Promise resolving to the result of the newsletter sending process
 */
export async function sendWeeklyNewsletters(): Promise<NewsletterResult> {
  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const trees = await db.tree.findMany({
      where: { newsletter: true },
      include: {
        accesses: { where: { user: { newsletter: true } }, include: { user: true } },
        nodes: {
          where: { createdAt: { gte: oneWeekAgo } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, fullName: true, birthDate: true, deathDate: true, createdAt: true },
        },
      },
    })

    let emailsSent = 0
    let errors = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(23, 59, 59, 999)

    for (const tree of trees) {
      if (tree.accesses.length === 0) continue

      const allNodes = await db.treeNode.findMany({
        where: { treeId: tree.id },
        select: { id: true, fullName: true, birthDate: true, deathDate: true },
      })

      const events: Array<{
        name: string
        eventType: 'birthday' | 'anniversary'
        date: string
        yearsAgo?: number
      }> = []

      allNodes.forEach((node) => {
        if (node.birthDate) {
          const birthDate = new Date(node.birthDate)
          const thisYearBirthday = new Date(
            today.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          )
          thisYearBirthday.setHours(0, 0, 0, 0)

          if (thisYearBirthday >= today && thisYearBirthday <= nextWeek) {
            const yearsAgo = today.getFullYear() - birthDate.getFullYear()
            events.push({
              name: node.fullName,
              eventType: 'birthday',
              date: thisYearBirthday.toISOString(),
              yearsAgo,
            })
          }
        }

        if (node.deathDate) {
          const deathDate = new Date(node.deathDate)
          const thisYearAnniversary = new Date(
            today.getFullYear(),
            deathDate.getMonth(),
            deathDate.getDate()
          )
          thisYearAnniversary.setHours(0, 0, 0, 0)

          if (thisYearAnniversary >= today && thisYearAnniversary <= nextWeek) {
            const yearsAgo = today.getFullYear() - deathDate.getFullYear()
            events.push({
              name: node.fullName,
              eventType: 'anniversary',
              date: thisYearAnniversary.toISOString(),
              yearsAgo,
            })
          }
        }
      })

      if (tree.nodes.length === 0 && events.length === 0) continue

      for (const access of tree.accesses) {
        if (!access.user.email) continue

        try {
          const result = await sendWeeklyNewsletter({
            recipientEmail: access.user.email,
            recipientName: access.user.name || access.user.email,
            treeName: tree.name,
            treeSlug: tree.slug,
            recentAdditions: tree.nodes.map((node) => ({
              name: node.fullName,
              addedDate: node.createdAt.toISOString(),
            })),
            events,
            totalMembers: allNodes.length,
            locale: access.user.language ? languageToLocale(access.user.language) : 'en',
          })

          if (result) {
            emailsSent++
          } else {
            errors++
          }
        } catch (error) {
          errors++
        }
      }
    }

    return { success: true, emailsSent, errors }
  } catch (error) {
    return { success: false, emailsSent: 0, errors: 1 }
  }
}
