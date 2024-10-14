import React, { useState, useEffect, useRef } from 'react';
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CButton,
  CForm, CFormInput, CFormSelect, CAlert
} from '@coreui/react';
import maplibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPaths, getCells, getGNBs, getUEs } from '../../utils/api';
import { removeMapLayersAndSources, addCellsToMap, addPathsToMap, addUEsToMap, handleUEClick } from './ModalUtils';

const EditUEModal = ({ visible, handleClose, handleSubmit, initialData, token }) => {
  const [formData, setFormData] = useState({
    supi: '',
    name: '',
    ext_identifier: '',
    cell_id: '',
    ip_address_v4: '',
    ip_address_v6: '',
    mac: '',
    mcc: '',
    mnc: '',
    dnn: '',
    path_id: '',
    speed: 'LOW',  // Default speed set to 'LOW'
    latitude: 0.0,
    longitude: 0.0
  });

  const [message, setMessage] = useState({ type: '', text: '' }); 
  const [paths, setPaths] = useState([]);
  const [gnbs, setGNBs] = useState([]);
  const [cells, setCells] = useState([]);
  const [ues, setUEs] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [pathsData, gnbData, cellData, ueData] = await Promise.all([
          getPaths(token),
          getGNBs(token),
          getCells(token),
          getUEs(token),
        ]);
        setPaths(pathsData);
        setGNBs(gnbData);
        setCells(cellData);
        setUEs(ueData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [token]);

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        latitude: initialData.position?.lat || initialData.latitude || 0.0,
        longitude: initialData.position?.lng || initialData.longitude || 0.0
      }));
    }
  }, [initialData, visible]);

  // Initialize or update MapLibre map
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        if (mapRef.current) {
          if (!mapInstanceRef.current) {
            mapInstanceRef.current = new maplibre.Map({
              container: mapRef.current,
              style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`,
              center: [formData.longitude, formData.latitude],
              zoom: 15,
            });

            mapInstanceRef.current.on('style.load', async () => {
              removeMapLayersAndSources(mapInstanceRef.current, cells.map(cell => `cell-${cell.id}`));
              addCellsToMap(mapInstanceRef.current, cells);
              addUEsToMap(mapInstanceRef.current, ues, handleUEClick);
              await addPathsToMap(mapInstanceRef.current, ues, token);
            });
          } else {
            // Update map center when formData changes
            mapInstanceRef.current.setCenter([formData.longitude, formData.latitude]);
          }
        }
      }, 500);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [visible, formData.latitude, formData.longitude]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    try {
      await handleSubmit(formData);
      setMessage({ type: 'success', text: 'User Equipment updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000); // Auto-hide after 3 seconds
      handleClose(); // Close the modal after successful update
    } catch (error) {
      console.error('Error updating User Equipment:', error);
      setMessage({ type: 'failure', text: 'Error: Failed to update the User Equipment.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000); // Auto-hide after 3 seconds
    }
  };

  return (
    <>
      {/* Status message display */}
      {message.text && (
        <CAlert
          color={message.type === 'success' ? 'success' : 'danger'}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999
          }}
        >
          {message.text}
        </CAlert>
      )}

      {/* Edit UE Modal */}
      <CModal visible={visible} onClose={handleClose} size="lg"> {/* Adjusted modal size */}
        <CModalHeader closeButton>Edit UE</CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              id="supi"
              name="supi"
              label="SUPI"
              value={formData.supi}
              onChange={handleChange}
              disabled
            />
            <CFormInput
              id="name"
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
            />
            <CFormInput
              id="ext_identifier"
              name="ext_identifier"
              label="External Identifier"
              value={formData.ext_identifier}
              onChange={handleChange}
            />
            <CFormInput
              id="cell_id"
              name="cell_id"
              label="Cell ID"
              value={formData.cell_id}
              onChange={handleChange}
            />
            <CFormInput
              id="ip_address_v4"
              name="ip_address_v4"
              label="IPv4 Address"
              value={formData.ip_address_v4}
              onChange={handleChange}
            />
            <CFormInput
              id="ip_address_v6"
              name="ip_address_v6"
              label="IPv6 Address"
              value={formData.ip_address_v6}
              onChange={handleChange}
            />
            <CFormInput
              id="mac"
              name="mac"
              label="MAC Address"
              value={formData.mac}
              onChange={handleChange}
            />
            <CFormInput
              id="mcc"
              name="mcc"
              label="MCC"
              value={formData.mcc}
              onChange={handleChange}
              disabled
            />
            <CFormInput
              id="mnc"
              name="mnc"
              label="MNC"
              value={formData.mnc}
              onChange={handleChange}
              disabled
            />
            <CFormInput
              id="dnn"
              name="dnn"
              label="DNN"
              value={formData.dnn}
              onChange={handleChange}
              disabled
            />
            <CFormSelect
              id="path_id"
              name="path_id"
              label="Path"
              value={formData.path_id}
              onChange={handleChange}
            >
              <option value="">Select a path</option>
              {paths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.description}
                </option>
              ))}
            </CFormSelect>

            <CFormSelect
              id="speed"
              name="speed"
              label="Speed"
              value={formData.speed}
              onChange={handleChange}
            >
              <option value="LOW">LOW</option>
              <option value="HIGH">HIGH</option>
            </CFormSelect>

            <CFormInput
              id="latitude"
              name="latitude"
              label="Latitude"
              value={formData.latitude}
              readOnly
            />
            <CFormInput
              id="longitude"
              name="longitude"
              label="Longitude"
              value={formData.longitude}
              readOnly
            />
            <div className="mt-3">
              <label className="form-label">Map</label>
              <div ref={mapRef} style={{ height: '400px', width: '100%' }}></div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleClose}>Cancel</CButton>
          <CButton color="primary" onClick={handleFormSubmit}>Save</CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EditUEModal;
