const REPO = 'ineno771/keyball-link';
const ISSUES_URL      = `https://github.com/${REPO}/issues/new`;
const DISCUSSIONS_URL = `https://github.com/${REPO}/discussions`;

export function FeedbackTab() {
  return (
    <div className="feedback-tab">
      <p className="feedback-intro">
        このツール・Keyball へのご意見をお寄せください。皆さんの声が今後の改善につながります。
      </p>

      {/* 不具合・エラー報告 */}
      <section className="feedback-card">
        <div className="feedback-card__icon">🐛</div>
        <div className="feedback-card__body">
          <h2 className="feedback-card__title">不具合・エラーの報告</h2>
          <p className="feedback-card__desc">
            アプリが動かない・設定が保存できない・表示がおかしいなどの不具合は、
            GitHub の Issues からご報告ください。できるだけ「何をしたか」「何が起きたか」を書いていただけると助かります。
          </p>
          <a className="btn btn--primary feedback-card__btn" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
            GitHub Issues で報告する ↗
          </a>
        </div>
      </section>

      {/* 要望・アイデア */}
      <section className="feedback-card">
        <div className="feedback-card__icon">💡</div>
        <div className="feedback-card__body">
          <h2 className="feedback-card__title">要望・アイデアの投稿</h2>
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
        </div>
      </section>

      <p className="feedback-note">
        ※ 投稿には無料の GitHub アカウントが必要です（お持ちでない方はアカウント作成画面が表示されます）。
      </p>
    </div>
  );
}
