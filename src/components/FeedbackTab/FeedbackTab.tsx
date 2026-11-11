import { translate } from '../../i18n';
import { TextKey } from '../../i18n/text.enum';
import { SettingsSidebarBoard, type BoardCard } from '../SettingsBoard/SettingsBoard';
import { TIPS } from '../../lib/tips';

const REPO = 'Yowkees/keyball-link';
const ISSUES_URL      = `https://github.com/${REPO}/issues/new`;
const DISCUSSIONS_URL = `https://github.com/${REPO}/discussions`;

// 2026-10-06〜: 他の設定タブと同じく、左に項目のタブ・右に選んだ項目を表示する。
export function FeedbackTab() {
  const note = (
    <p className="feedback-note">{translate(TextKey.FeedbackTabPostingRequiresAFreeGitHubAccount)}</p>
  );
  const cards: BoardCard[] = [
    {
      key: 'bug', get title() { return translate(TextKey.FeedbackTabReportAProblem); }, tip: TIPS.fbBug,
      render: () => (
        <div className="feedback-panel">
          <p className="feedback-card__desc">{translate(TextKey.FeedbackTabReportAppErrorsSettingsThatDo)}</p>
          <a className="btn btn--primary feedback-card__btn" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">{translate(TextKey.FeedbackTabReportOnGitHubIssues)}</a>
          {note}
        </div>
      ),
    },
    {
      key: 'idea', get title() { return translate(TextKey.FeedbackTabSuggestAFeature); }, tip: TIPS.fbIdea,
      render: () => (
        <div className="feedback-panel">
          <p className="feedback-card__desc">{translate(TextKey.FeedbackTabShareFeatureRequestsAndIdeasFor)}</p>
          <ul className="feedback-examples">
            <li>{translate(TextKey.FeedbackTabWirelessSupport)}</li>
            <li>{translate(TextKey.FeedbackTabALowProfileVersion)}</li>
            <li>{translate(TextKey.FeedbackTabACaseForTheKeyboard)}</li>
            <li>{translate(TextKey.FeedbackTabAdditionalAppFeatures)}</li>
          </ul>
          <a className="btn btn--primary feedback-card__btn" href={DISCUSSIONS_URL} target="_blank" rel="noopener noreferrer">{translate(TextKey.FeedbackTabPostOrBrowseGitHubDiscussions)}</a>
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
