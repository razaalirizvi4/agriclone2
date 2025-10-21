import { useState, useEffect } from 'react';

const useCropViewModel = (props) => {
  const [cropData, setCropData] = useState(null);
console.log("The data of crops:",props)
  useEffect(() => {
    if (props && props.crop) {
      // In a real app, you might do further processing or validation here
      setCropData(props.crop);
    }
  }, [props]);

  return {
    crop: cropData,
  };
};

export default useCropViewModel;