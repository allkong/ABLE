import { create } from 'zustand';

import { ImageStore } from '@features/train/types/analyze.type'


export const useImageStore = create<ImageStore>((set) => ({
   uploadedImage: null,
   heatMapImage: null,
   classScores: [],

   lastConv2dId: '',

   setUploadedImage: (image) => set({ uploadedImage: image }),
   setLastConv2dId: (id) => set({ lastConv2dId: id }),

   setHeatMapImage: (data) => {
      set({
         heatMapImage: data.heatMapImage,
         classScores: data.classScores,
      });
   },

   setAllImage: (data) => {
      set({
         uploadedImage: data.uploadedImage,
         heatMapImage: data.heatMapImage,
         classScores: data.classScores,
      });
   },
}));