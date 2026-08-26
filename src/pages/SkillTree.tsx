import { Link } from 'react-router-dom'
import { ChapterHead, Hanko, Panel, Turn } from '../components/chrome'
import { achievements, leadership, projects, skills } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

/** `React.js` in the skill list and `React` in a stack are the same thing. */
function normalize(value: string) {
  return value.toLowerCase().replace(/\.js$/, '').trim()
}

/**
 * A skill is only interesting if it shipped. Anything that shows up in a
 * project stack links straight to the project that used it, so the tree is a
 * set of doors rather than a word cloud.
 */
const projectBySkill = new Map<string, string>()
for (const project of projects) {
  for (const item of project.stack) {
    const key = normalize(item)
    if (!projectBySkill.has(key)) projectBySkill.set(key, project.slug)
  }
}

const groups = [
  { title: 'languages', items: skills.languages },
  { title: 'ai / ml', items: skills.aiml },
  { title: 'frameworks', items: skills.frameworks },
  { title: 'infra', items: skills.infra },
]

export function SkillTree() {
  const entry = entryFor('/skill-tree')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />

      <p className="lede">the ones with a link, i actually used on something.</p>

      <div className="panel-grid">
        {groups.map((group) => (
          <Panel key={group.title}>
            <h2>{group.title}</h2>
            <ul className="tags">
              {group.items.map((skill) => {
                const slug = projectBySkill.get(normalize(skill))
                return (
                  <li key={skill}>
                    {slug ? (
                      <Link to={`/projects/${slug}`} title={`used this in ${slug}`}>
                        {skill}
                      </Link>
                    ) : (
                      skill
                    )}
                  </li>
                )
              })}
            </ul>
          </Panel>
        ))}
      </div>

      <Panel tone>
        <h2>stamps i earned</h2>
        {achievements.map((achievement) => (
          <div className="stamp-row" key={achievement.label}>
            <Hanko label={achievement.stamp} />
            <p>{achievement.label}</p>
          </div>
        ))}
      </Panel>

      <Panel>
        <h2>roots (side quests)</h2>
        <ul>
          {leadership.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>

      <Turn path="/skill-tree" />
    </main>
  )
}
