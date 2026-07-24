import { supabaseAdmin } from "@/lib/supabase/admin"

function handleError(error: any) {
  if (error) throw new Error(error.message || "Database error")
}

function model(tableName: string) {
  return supabaseAdmin.from(tableName as any)
}

function buildWhere(query: any, where: any, prefix = "") {
  for (const [key, value] of Object.entries(where)) {
    if (value === null || value === undefined) continue
    const field = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && !Array.isArray(value)) {
      if ("in" in value) query = query.in(field, value.in)
      else if ("gte" in value) query = query.gte(field, value.gte)
      else if ("lte" in value) query = query.lte(field, value.lte)
      else if ("gt" in value) query = query.gt(field, value.gt)
      else if ("lt" in value) query = query.lt(field, value.lt)
      else if ("not" in value && value.not !== null) query = query.neq(field, value.not)
      else query = buildWhere(query, value, field)
    } else {
      query = query.eq(field, value)
    }
  }
  return query
}

function prismaSelectToStr(sel: any): string {
  if (!sel || typeof sel === "string") return sel || "*"
  if (Array.isArray(sel)) return sel.join(",")
  const parts: string[] = []
  for (const [key, val] of Object.entries(sel)) {
    if (val === true) parts.push(key)
    else if (typeof val === "object" && val !== null && "select" in val) {
      const inner = prismaSelectToStr(val.select)
      parts.push(`${key}(${inner})`)
    }
  }
  return parts.join(",")
}

function createModel(name: string) {
  return {
    findMany: async (opts: any = {}): Promise<any[]> => {
      let query = model(name).select(prismaSelectToStr(opts.select))
      if (opts.where) query = buildWhere(query, opts.where)
      if (opts.orderBy) {
        const orders = Array.isArray(opts.orderBy) ? opts.orderBy : [opts.orderBy]
        for (const o of orders)
          for (const [k, dir] of Object.entries(o))
            query = query.order(k as string, { ascending: dir === "asc" })
      }
      if (opts.take) query = query.limit(opts.take)
      if (opts.skip) query = query.range(opts.skip, opts.skip + (opts.take || 10) - 1)
      const { data, error } = await query
      handleError(error)
      return (data || []) as any[]
    },

    findUnique: async (opts: { where: any; include?: any; select?: any }): Promise<any> => {
      let query = model(name).select(prismaSelectToStr(opts.select))
      query = buildWhere(query, opts.where)
      const { data, error } = await query.maybeSingle()
      handleError(error)
      return data || null
    },

    findFirst: async (opts: { where?: any; orderBy?: any }): Promise<any> => {
      let query = model(name).select("*")
      if (opts.where) query = buildWhere(query, opts.where)
      if (opts.orderBy)
        for (const [k, dir] of Object.entries(opts.orderBy))
          query = query.order(k as string, { ascending: dir === "asc" })
      const { data, error } = await query.maybeSingle()
      handleError(error)
      return data || null
    },

    create: async (opts: { data: any; select?: any }): Promise<any> => {
      const q = model(name).insert(opts.data).select(prismaSelectToStr(opts.select))
      const { data, error } = await q.single()
      handleError(error)
      return data || null
    },

    update: async (opts: { where: any; data: any }): Promise<any> => {
      const updateData: Record<string, any> = {}
      for (const [k, v] of Object.entries(opts.data)) {
        const val = v as any
        if (typeof val === "object" && val !== null && "increment" in val) {
          const { data: current } = await model(name).select(k).eq("id", opts.where.id).single()
          updateData[k] = ((current as any)?.[k] || 0) + val.increment
        } else if (typeof val === "object" && val !== null && "decrement" in val) {
          const { data: current } = await model(name).select(k).eq("id", opts.where.id).single()
          updateData[k] = ((current as any)?.[k] || 0) - val.decrement
        } else {
          updateData[k] = val
        }
      }
      let query = model(name).update(updateData).select()
      query = buildWhere(query, opts.where)
      const { data, error } = await query.single()
      handleError(error)
      return data || null
    },

    delete: async (opts: { where: any }): Promise<void> => {
      let query = model(name).delete()
      query = buildWhere(query, opts.where)
      const { error } = await query
      handleError(error)
    },

    deleteMany: async (opts: { where: any }): Promise<void> => {
      let query = model(name).delete()
      query = buildWhere(query, opts.where)
      const { error } = await query
      handleError(error)
    },

    count: async (opts: { where?: any } = {}): Promise<number> => {
      let query = model(name).select("*", { count: "exact", head: true })
      if (opts.where) query = buildWhere(query, opts.where)
      const { count, error } = await query
      handleError(error)
      return count || 0
    },

    upsert: async (opts: { where: any; create: any; update: any }): Promise<any> => {
      let query = model(name).select("*")
      for (const val of Object.values(opts.where)) {
        if (typeof val === "object" && val !== null) {
          for (const [k, v] of Object.entries(val)) query = query.eq(k, v)
        } else {
          const k = Object.keys(opts.where)[0]
          query = query.eq(k, val)
          break
        }
      }
      const existing = await query.maybeSingle()
      if (existing.data) {
        let q = model(name).update(opts.update).select()
        for (const val of Object.values(opts.where)) {
          if (typeof val === "object" && val !== null)
            for (const [k, v] of Object.entries(val)) q = q.eq(k, v)
          else { q = q.eq(Object.keys(opts.where)[0], val); break }
        }
        const { data, error } = await q.single()
        handleError(error)
        return data || null
      } else {
        const q = model(name).insert(opts.create).select("*")
        const { data, error } = await q.single()
        handleError(error)
        return data || null
      }
    },

    createMany: async (opts: { data: any[] }): Promise<void> => {
      const { error } = await model(name).insert(opts.data)
      handleError(error)
    },
  }
}

export const prisma = {
  $transaction: async (operations: any[]) => {
    const results = []
    for (const op of operations) {
      results.push(typeof op === "function" ? await op() : op)
    }
    return results
  },

  user: createModel("User"),
  profile: createModel("Profile"),
  category: createModel("Category"),
  referenceImage: createModel("ReferenceImage"),
  practiceSession: createModel("PracticeSession"),
  drawingSubmission: createModel("DrawingSubmission"),
  achievement: createModel("Achievement"),
  userAchievement: createModel("UserAchievement"),
  challenge: createModel("Challenge"),
  challengeParticipant: createModel("ChallengeParticipant"),
  communityPost: createModel("CommunityPost"),
  comment: createModel("Comment"),
  like: createModel("Like"),
  follow: createModel("Follow"),
  collection: createModel("Collection"),
  collectionItem: createModel("CollectionItem"),
  bookmark: createModel("Bookmark"),
  article: createModel("Article"),
}
