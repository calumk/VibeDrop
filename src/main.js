import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import router from './router'
import App from './App.vue'

// PrimeVue Components
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import ProgressBar from 'primevue/progressbar'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import Divider from 'primevue/divider'
import Chip from 'primevue/chip'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'

// PrimeIcons
import 'primeicons/primeicons.css'

// Common Styles
import './styles/common.css'

// Utils
import { setFavicon } from './utils/favicon'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode'
    }
  }
})

app.use(ToastService)
app.use(router)

// Register PrimeVue components
app.component('Button', Button)
app.component('Card', Card)
app.component('InputText', InputText)
app.component('Password', Password)
app.component('ProgressBar', ProgressBar)
app.component('Toast', Toast)
app.component('Dialog', Dialog)
app.component('FileUpload', FileUpload)
app.component('Divider', Divider)
app.component('Chip', Chip)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Tag', Tag)
app.component('Textarea', Textarea)
app.component('Dropdown', Dropdown)

// Set favicon from environment variable
setFavicon()

app.mount('#app') 