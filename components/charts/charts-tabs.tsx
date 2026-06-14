'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MusicGrid } from '@/components/music-card'
import { Mic2, Music } from 'lucide-react'
import type { MusicItem } from '@/lib/types'

interface ChartsTabsProps {
  defaultTab: 'artists' | 'tracks'
  artists: MusicItem[]
  tracks: MusicItem[]
}

export function ChartsTabs({ defaultTab, artists, tracks }: ChartsTabsProps) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="artists" className="gap-2">
          <Mic2 className="size-4" />
          Top Artistes
        </TabsTrigger>
        <TabsTrigger value="tracks" className="gap-2">
          <Music className="size-4" />
          Top Morceaux
        </TabsTrigger>
      </TabsList>

      <TabsContent value="artists">
        <MusicGrid items={artists} showType={false} columns={5} />
      </TabsContent>

      <TabsContent value="tracks">
        <MusicGrid items={tracks} showType={false} variant="horizontal" />
      </TabsContent>
    </Tabs>
  )
}
