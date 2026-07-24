"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    setPosts([])
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-muted-foreground mt-1">Share your work and get inspired</p>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <p className="font-medium">{p.user?.name}</p>
                {p.caption && <p className="text-sm mt-1">{p.caption}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">🎨</div>
            <p className="text-lg font-medium">Community Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">Share your drawings and connect with other artists.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
