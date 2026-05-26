import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf8')

function readEnv(key) {
  const line = envContent.split('\n').find(l => l.startsWith(`${key}=`))
  return line?.split('=').slice(1).join('=')?.trim()
}

const SUPABASE_URL = readEnv('VITE_SUPABASE_URL')
const ANON_KEY = readEnv('VITE_SUPABASE_ANON_KEY')
const SERVICE_ROLE_KEY = readEnv('VITE_SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('Missing required env vars in .env. Need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function api(method, path, body) {
  const url = `${SUPABASE_URL}${path}`
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 200)}`)
  }
  try { return JSON.parse(text) } catch { return text }
}

const COLLABORATORS = [
  { name: 'Alice Martin', email: 'alice.martin@example.com' },
  { name: 'Bob Bernard', email: 'bob.bernard@example.com' },
  { name: 'Chloé Dubois', email: 'chloe.dubois@example.com' },
  { name: 'David Petit', email: 'david.petit@example.com' },
  { name: 'Emma Leroy', email: 'emma.leroy@example.com' },
  { name: 'François Moreau', email: 'francois.moreau@example.com' },
  { name: 'Gaëlle Lambert', email: 'gaelle.lambert@example.com' },
  { name: 'Hugo Girard', email: 'hugo.girard@example.com' },
  { name: 'Inès Roux', email: 'ines.roux@example.com' },
  { name: 'Jules Vincent', email: 'jules.vincent@example.com' },
  { name: 'Karine Fournier', email: 'karine.fournier@example.com' },
  { name: 'Lucas Morel', email: 'lucas.morel@example.com' },
  { name: 'Manon Lefebvre', email: 'manon.lefebvre@example.com' },
  { name: 'Nathan Mercier', email: 'nathan.mercier@example.com' },
  { name: 'Océane Caron', email: 'oceane.caron@example.com' },
  { name: 'Pierre Gauthier', email: 'pierre.gauthier@example.com' },
  { name: 'Quitterie Perrin', email: 'quitterie.perrin@example.com' },
  { name: 'Romain Boucher', email: 'romain.boucher@example.com' },
  { name: 'Sarah Dumont', email: 'sarah.dumont@example.com' },
  { name: 'Thomas Giraud', email: 'thomas.giraud@example.com' },
]

const SKILLS_BY_CATEGORY = {
  'Réseau': ['Routage & Switching', 'Firewall', 'VPN', 'Wireshark / Analyse'],
  'Système': ['Linux', 'Windows Server', 'Virtualisation (Proxmox)', 'Ansible'],
  'Cloud': ['AWS', 'Azure', 'GCP', 'Terraform'],
  'Sécurité': ['Pentest', 'SOC / SIEM', 'PKI', 'ISO 27001'],
  'Base de données': ['PostgreSQL', 'MySQL', 'MongoDB', 'Admin BDD'],
  'Monitoring': ['Prometheus', 'Grafana', 'ELK Stack', 'Zabbix'],
  'Stockage': ['SAN / NAS', 'Backup (Veeam)', 'Ceph', 'Minio'],
}

function randomLevel() {
  return Math.floor(Math.random() * 4) + 1
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('=== Début du seed ===\n')

  // 1. Récupérer les catégories
  console.log('1. Récupération des catégories...')
  const categories = await api('GET', '/rest/v1/categories')
  console.log(`   → ${categories.length} catégories trouvées`)

  // 2. Créer les skills
  console.log('\n2. Création des skills...')
  const skillIds = []
  for (const cat of categories) {
    const skills = SKILLS_BY_CATEGORY[cat.name]
    if (!skills) { console.log(`   ⚠ Pas de skills pour "${cat.name}"`); continue }
    for (const skillName of skills) {
      const existing = await api('GET', `/rest/v1/skills?name=eq.${encodeURIComponent(skillName)}&category_id=eq.${cat.id}`)
      if (existing.length > 0) {
        skillIds.push(existing[0].id)
        console.log(`   ⏩ ${skillName} (${cat.name}) — existe déjà`)
        continue
      }
      const data = await api('POST', '/rest/v1/skills', { name: skillName, category_id: cat.id })
      skillIds.push(data[0].id)
      console.log(`   ✓ ${skillName} (${cat.name})`)
    }
  }
  console.log(`   → ${skillIds.length} skills prêts`)

  // 3. Récupérer l'admin
  console.log('\n3. Recherche de l\'admin...')
  const members = await api('GET', '/rest/v1/members')
  const adminId = members.find(m => m.role === 'admin')?.id
  if (!adminId) { console.error('Aucun admin trouvé'); return }
  console.log(`   ✓ Admin: ${members.find(m => m.id === adminId)?.full_name} (${adminId})`)

  // 4. Créer les utilisateurs Auth
  console.log('\n4. Création des collaborateurs (Auth)...')
  const memberIds = []
  const defaultPassword = 'password123'

  for (const collab of COLLABORATORS) {
    const existing = await api('GET', `/rest/v1/members?email=eq.${encodeURIComponent(collab.email)}`)
    if (existing.length > 0) {
      console.log(`   ⏩ ${collab.name} — existe déjà (member ID: ${existing[0].id})`)
      memberIds.push(existing[0].id)
      continue
    }

    const user = await api('POST', '/auth/v1/admin/users', {
      email: collab.email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { full_name: collab.name },
    })

    console.log(`   ✓ ${collab.name} (${collab.email})`)
    memberIds.push(user.id)
  }
  console.log(`   → ${memberIds.length} collaborateurs`)

  // Attendre que le trigger crée les members
  console.log('\n   Attente de la création des membres par le trigger...')
  await delay(3000)

  // Vérifier que tous les membres ont été créés
  for (const memberId of memberIds) {
    const m = await api('GET', `/rest/v1/members?id=eq.${memberId}`)
    if (m.length === 0) {
      console.log(`   ⚠ Membre manquant pour ${memberId}, création manuelle...`)
      const collab = COLLABORATORS.find(c => {
        // On ne peut pas matcher facilement, on va juste récupérer l'email depuis auth
        return true
      })
      const userInfo = await api('GET', `/auth/v1/admin/users/${memberId}`)
      await api('POST', '/rest/v1/members', {
        id: memberId,
        email: userInfo.email,
        full_name: userInfo.user_metadata?.full_name || '',
        role: 'member',
      })
    }
  }

  // 5. Assigner des niveaux
  console.log('\n5. Assignation des niveaux...')
  let levelCount = 0
  for (const memberId of memberIds) {
    for (const skillId of skillIds) {
      const level = randomLevel()
      const existing = await api('GET', `/rest/v1/skill_levels?member_id=eq.${memberId}&skill_id=eq.${skillId}`)
      if (existing.length > 0) {
        await api('PATCH', `/rest/v1/skill_levels?member_id=eq.${memberId}&skill_id=eq.${skillId}`, { level })
      } else {
        await api('POST', '/rest/v1/skill_levels', { member_id: memberId, skill_id: skillId, level })
      }
      levelCount++
    }
  }
  console.log(`   → ${levelCount} niveaux assignés`)

  // 6. Créer un historique pour les 10 premiers
  console.log('\n6. Création de l\'historique...')
  let historyCount = 0
  for (let i = 0; i < Math.min(10, memberIds.length); i++) {
    const memberId = memberIds[i]
    const numChanges = Math.floor(Math.random() * 5) + 2
    for (let j = 0; j < numChanges; j++) {
      const skillId = pickRandom(skillIds)
      const oldLevel = randomLevel()
      const newLevel = Math.min(oldLevel + Math.floor(Math.random() * 2) + 1, 4)
      if (newLevel === oldLevel) continue

      const daysAgo = Math.floor(Math.random() * 30) + 1
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString()

      await api('POST', '/rest/v1/skill_history', {
        member_id: memberId,
        skill_id: skillId,
        old_level: oldLevel,
        new_level: newLevel,
        changed_by: adminId,
        created_at: createdAt,
      })
      historyCount++
    }
  }
  console.log(`   → ${historyCount} entrées d\'historique`)

  // Résumé
  const finalCategories = await api('GET', '/rest/v1/categories')
  const finalSkills = await api('GET', '/rest/v1/skills')
  const finalMembers = await api('GET', '/rest/v1/members')
  const finalLevels = await api('GET', '/rest/v1/skill_levels')
  const finalHistory = await api('GET', '/rest/v1/skill_history')

  console.log('\n=== Seed terminé ===')
  console.log(`   ${finalCategories.length} catégories`)
  console.log(`   ${finalSkills.length} skills`)
  console.log(`   ${finalMembers.length} membres (dont ${finalMembers.filter(m => m.role === 'admin').length} admin)`)
  console.log(`   ${finalLevels.length} niveaux assignés`)
  console.log(`   ${finalHistory.length} entrées d'historique`)
}

main().catch(err => {
  console.error('ERREUR:', err.message)
  process.exit(1)
})
