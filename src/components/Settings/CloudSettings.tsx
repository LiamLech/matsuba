// ============================================================
// matsuba - CloudSettings（クラウド設定）
// ============================================================

import React from 'react'
import { GoogleDriveSync } from './GoogleDriveSync'
import styles from './CloudSettings.module.css'

export const CloudSettings: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>クラウド連携</h2>
        <p className={styles.desc}>
          クラウドストレージと連携することで、原稿を自動的に同期・バックアップできます。
        </p>
      </div>

      {/* Google Drive */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Google Drive</div>
        <GoogleDriveSync />
      </div>

      {/* Dropbox（Phase 3後半） */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Dropbox</div>
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.cardTitle}>Dropbox連携（準備中）</div>
            <div className={styles.cardDesc}>
              Phase 3後半で実装予定です。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
