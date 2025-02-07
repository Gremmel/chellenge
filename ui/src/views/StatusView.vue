<template>
  <main>
    <div class="text-center mt-4">
      <div class="container">
        asdf
      </div>

    </div>
  </main>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useDialogStore } from '@/stores/dialogStore';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const statusData = ref({});
const vereineList = reactive([]);

const getStatusData = async () => {
  let response;

  try {
    response = await fetch(`/api/getStatusData`, {
      method: 'GET',
      credentials: 'include'  // Cookies mitsenden
    });

    const result = await response.json();
    console.log('getStatusData result', result);

    if (response.ok) {
      statusData.value = result;
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function getVereineList() {
    try {
      let response;
      response = await fetch(`/api/getVereineList`, {
        method: 'GET',
        credentials: 'include'  // Cookies mitsenden
      });

      const result = await response.json();

      console.log('getVerineList result', result);

      if (response.ok) {
        vereineList.splice(0);

        for (const vereine of result.vereineList) {
          vereineList.push(vereine);
        }

        getStatusData();

      } else {
        setTimeout(() => {
          dialogStore.setParameter('Fehlercode 103', `${response.status} ${response.statusText}`, 'ok', null, '', null, null);
        }, 1000);
        console.log(result.message || 'keine Daten vorhanden');
      }
    } catch (error) {
      console.error('Es gab ein Problem mit dem Abrufen der getVereineList:', error);
      setTimeout(() => {
        dialogStore.setParameter('Fehlercode 107', `${error.message}`, 'ok', null, '', null, null);
      }, 1000);
    }
  }

onMounted(() => {
  getVereineList();
});
</script>

<style scoped>
.center-image {
  display: block;
  margin-left: auto;
  margin-right: auto;
  max-width: 80%;
}
</style>