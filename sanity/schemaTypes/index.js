import user from '@/sanity-schemas/user'
import config from '@/sanity-schemas/config'
import visitorLog from '@/sanity-schemas/visitorLog'
import blockedIPs from '@/sanity-schemas/blockedIPs'

export const schema = {
    types: [user, config, visitorLog, blockedIPs],
}
