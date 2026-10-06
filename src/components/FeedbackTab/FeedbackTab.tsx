import { SettingsSidebarBoard, type BoardCard } from '../SettingsBoard/SettingsBoard';
import { TIPS } from '../../lib/tips';

const REPO = 'Yowkees/keyball-link';
const ISSUES_URL      = `https://github.com/${REPO}/issues/new`;
const DISCUSSIONS_URL = `https://github.com/${REPO}/discussions`;

// 2026-10-06〜: 他の設定タブと同じく、左に項目のタブ・右に選んだ項目を表示する。
export function FeedbackTab() {
  const note = (
    <p className="feedback-note">
      ※ 投稿には無料の GitHub アカウントが必要です（お持ちでない方はアカウント作成画面が表示されます）。
    </p>
  );
  const cards: BoardCard[] = [
    {
      key: 'bug', title: '不具合・エラーの報告', tip: TIPS.fbBug,
      render: () => (
        <div className="feedback-panel">
          <p className="feedback-card__desc">
            アプリが動かない・設定が保存できない・表示がおかしいなどの不具合は、
            GitHub の Issues からご報告ください。できるだけ「何をしたか」「何が起きたか」を書いていただけると助かります。
          </p>
          <a className="btn btn--primary feedback-card__btn" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
            GitHub Issues で報告する ↗
          </a>
          {note}
        </div>
      ),
    },
    {
      key: 'idea', title: '要望・アイデアの投稿', tip: TIPS.fbIdea,
      render: () => (
        <div className="feedback-panel">
          <p className="feedback-card__desc">
            「こんな機能が欲しい」「Keyball がこうなったら嬉しい」というアイデアは
            GitHub の Discussions へ。他の人の投稿も見られて、👍 で応援（投票）もできます。
          </p>
          <ul className="feedback-examples">
            <li>無線化してほしい</li>
            <li>ロープロファイル版が欲しい</li>
            <li>本体ケースを販売してほしい</li>
            <li>アプリにこんな機能を追加してほしい</li>
          </ul>
          <a className="btn btn--primary feedback-card__btn" href={DISCUSSIONS_URL} target="_blank" rel="noopener noreferrer">
            GitHub Discussions で投稿・閲覧する ↗
          </a>
          {note}
        </div>
      ),
    },
  ];
  return (
    <div className="settings-tab">
      <SettingsSidebarBoard cards={cards} />
    </div>
  );
}
