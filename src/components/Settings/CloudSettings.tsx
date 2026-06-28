// ============================================================
// matsuba - CloudSettings（クラウド設定 — Phase 3用の枠）
// ============================================================

import React from 'react'
import styles from './CloudSettings.module.css'

export const CloudSettings: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>クラウド連携</h2>
        <p className={styles.desc}>
          DropboxまたはGoogle DriveのAPIキーを設定することで、
          原稿を自動的にクラウドへ同期できます。
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardIcon}>☁</div>
        <div className={styles.cardBody}>
          <div className={styles.cardTitle}>Phase 3で実装予定</div>
          <div className={styles.cardDesc}>
            現在はZIPバックアップによる手動保存をご利用ください。
            ヘッダーの「↓ バックアップ」から全原稿をまとめて保存できます。
          </div>
        </div>
      </div>

      {/* 将来の設定項目（現在は無効） */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Dropbox</div>
        <div className={styles.formGroup}>
          <label className={styles.label}>APIキー</label>
          <input
            className={styles.input}
            type="password"
            placeholder="Phase 3で有効になります"
            disabled
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Google Drive</div>
        <div className={styles.formGroup}>
          <label className={styles.label}>APIキー</label>
          <input
            className={styles.input}
            type="password"
            placeholder="Phase 3で有効になります"
            disabled
          />
        </div>
      </div>
    </div>
  )
}
