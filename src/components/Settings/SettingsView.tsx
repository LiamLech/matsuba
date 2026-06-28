// ============================================================
// matsuba - SettingsView（設定画面）
// ============================================================

import React, { useState } from 'react'
import { TagManager } from './TagManager'
import { LayoutPresetEditor } from './LayoutPresetEditor'
import { CloudSettings } from './CloudSettings'
import styles from './SettingsView.module.css'

type SettingsTab = 'tags' | 'presets' | 'cloud'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'tags',    label: 'タグ管理' },
  { id: 'presets', label: 'レイアウト' },
  { id: 'cloud',   label: 'クラウド' },
]

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('tags')

  return (
    <div className={styles.view}>
      {/* タブ */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div className={styles.content}>
        {activeTab === 'tags'    && <TagManager />}
        {activeTab === 'presets' && <LayoutPresetEditor />}
        {activeTab === 'cloud'   && <CloudSettings />}
      </div>
    </div>
  )
}
