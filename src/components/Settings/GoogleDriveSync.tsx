// ============================================================
// matsuba - GoogleDriveSync（同期ボタン・状態表示）
// ============================================================

import React from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useGoogleDriveStore } from '../../store/googleDriveStore'
import styles from './GoogleDriveSync.module.css'

export const GoogleDriveSync: React.FC = () => {
  const manuscripts = useManuscriptStore((s) => s.manuscripts)
  const loadFromDrive = useManuscriptStore((s) => s.loadFromDrive)

  const accessToken  = useGoogleDriveStore((s) => s.accessToken)
  const status       = useGoogleDriveStore((s) => s.status)
  const lastSyncedAt = useGoogleDriveStore((s) => s.lastSyncedAt)
  const error        = useGoogleDriveStore((s) => s.error)
  const isLoading    = useGoogleDriveStore((s) => s.isLoading)
  const setAccessToken = useGoogleDriveStore((s) => s.setAccessToken)
  const clearToken   = useGoogleDriveStore((s) => s.clearToken)
  const sync         = useGoogleDriveStore((s) => s.sync)

  const isConnected = accessToken !== null

  const login = useGoogleLogin({
    onSuccess: (res) => {
      // ログイン時にDriveから自動読み込み
      setAccessToken(res.access_token, loadFromDrive)
    },
    onError: () => console.error('Google login failed'),
    scope: 'https://www.googleapis.com/auth/drive.file',
  })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.serviceIcon}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M6.18 15l-2.16 3.73L6 21h12l2-3.27H6.18z"/>
            <path fill="#FBBC05" d="M3 18.73L6.18 15H.84L3 18.73z"/>
            <path fill="#0F9D58" d="M12 3L7.18 11H16.8L12 3z"/>
            <path fill="#EA4335" d="M7.18 11L3 18.73h3.18L10.36 11z"/>
            <path fill="#4285F4" d="M16.82 11L12 3l-1.64 2.84L16.8 11h.02z"/>
            <path fill="#34A853" d="M21.16 18.73L19 15h-2.18l4.34 3.73z"/>
          </svg>
        </div>
        <div className={styles.serviceInfo}>
          <div className={styles.serviceName}>Google Drive</div>
          <div className={`${styles.serviceStatus} ${isConnected ? styles.statusConnected : styles.statusDisconnected}`}>
            {isConnected ? '接続中' : '未接続'}
          </div>
        </div>
      </div>

      {isConnected && (
        <div className={styles.syncInfo}>
          {isLoading && (
            <div className={styles.syncRow}>
              <span className={styles.syncingDot} />
              <span>Driveから読み込み中…</span>
            </div>
          )}
          {!isLoading && status === 'syncing' && (
            <div className={styles.syncRow}>
              <span className={styles.syncingDot} />
              <span>同期中…</span>
            </div>
          )}
          {!isLoading && status === 'success' && lastSyncedAt && (
            <div className={styles.syncRow}>
              <span className={styles.successDot} />
              <span>最終同期：{formatTime(lastSyncedAt)}</span>
            </div>
          )}
          {status === 'error' && (
            <div className={styles.syncRow}>
              <span className={styles.errorDot} />
              <span className={styles.errorText}>{error ?? '同期に失敗しました'}</span>
            </div>
          )}
          <div className={styles.syncNote}>
            30秒ごとに自動同期 · Driveの「matsuba」フォルダに保存
          </div>
          <div className={styles.syncWarning}>
            ⚠ 複数端末で使用する場合は同時に編集しないでください。別端末に切り替える前に同期を確認してください。
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {isConnected ? (
          <>
            <button
              className="btn"
              onClick={() => sync(manuscripts)}
              disabled={status === 'syncing' || isLoading}
            >
              今すぐ同期
            </button>
            <button className="btn btn--danger" onClick={clearToken}>
              切断
            </button>
          </>
        ) : (
          <button className="btn btn--primary" onClick={() => login()}>
            Googleでログイン
          </button>
        )}
      </div>
    </div>
  )
}
