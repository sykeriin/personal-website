import { ChapterHeader, MangaPanel } from '../components/ChapterHeader'
import { Hanko } from '../components/Hanko'
import { NextChapter } from '../components/NextChapter'
import { achievements, leadership, skills } from '../data/content'

const groups = [
  { title: 'Languages', items: skills.languages },
  { title: 'AI / ML', items: skills.aiml },
  { title: 'Frameworks', items: skills.frameworks },
  { title: 'Infra', items: skills.infra },
]

export function SkillTree() {
  return (
    <main className="chapter">
      <ChapterHeader title="Extra" subtitle="Skill Tree" />

      <div className="skill-groups" style={{ marginBottom: '2rem' }}>
        {groups.map((group, i) => (
          <MangaPanel key={group.title} delay={i * 0.05}>
            <h3>{group.title}</h3>
            <div className="stack-stamps">
              {group.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </MangaPanel>
        ))}
      </div>

      <MangaPanel delay={0.1}>
        <h3>Achievement hankos</h3>
        {achievements.map((a, i) => (
          <div className="achievement-row" key={`${a.stamp}-${a.label}`}>
            <Hanko label={a.stamp} delay={0.05 * i} />
            <p>{a.label}</p>
          </div>
        ))}
      </MangaPanel>

      <div style={{ height: '1rem' }} />

      <MangaPanel delay={0.15}>
        <h3>Side quests</h3>
        <ul className="side-quests">
          {leadership.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </MangaPanel>

      <NextChapter path="/skill-tree" />
    </main>
  )
}
