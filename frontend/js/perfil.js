document.addEventListener('authLoaded', async () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    try {
        const resProfile = await fetch('/api/user/profile');
        if (resProfile.ok) {
            const prof = await resProfile.json();
            document.getElementById('prof-name').value = prof.name || '';
            document.getElementById('prof-email').value = prof.email || '';
            document.getElementById('prof-phone').value = prof.phone || '';
            document.getElementById('prof-address').value = prof.address || '';
            if (prof.profile_picture) {
                document.getElementById('prof-img-preview').src = prof.profile_picture;
            }
        } else {
            const user = Auth.getUser();
            document.getElementById('prof-name').value = user.name || '';
            document.getElementById('prof-email').value = user.email || '';
            if (user.profile_picture) {
                document.getElementById('prof-img-preview').src = user.profile_picture;
            }
        }
    } catch (err) {
        const user = Auth.getUser();
        document.getElementById('prof-name').value = user.name || '';
        document.getElementById('prof-email').value = user.email || '';
    }

    // Handle Profile Update
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('prof-btn');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        try {
            // Upload picture first if selected
            const photoInput = document.getElementById('prof-photo-input');
            if (photoInput.files.length > 0) {
                const formData = new FormData();
                formData.append('avatar', photoInput.files[0]);
                const resPhoto = await fetch('/api/user/profile-picture', {
                    method: 'POST',
                    body: formData
                });
                const photoData = await resPhoto.json();
                if (!resPhoto.ok) {
                    window.UI.toast('Erro ao carregar foto: ' + (photoData.error || 'Erro desconhecido'), 'error');
                } else {
                    // Update preview and auth state
                    document.getElementById('prof-img-preview').src = photoData.profile_picture;
                    // Optionally update header immediately
                    const headerImgs = document.querySelectorAll('.profile-img');
                    headerImgs.forEach(img => img.src = photoData.profile_picture);
                }
            }

            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('prof-name').value,
                    email: document.getElementById('prof-email').value,
                    phone: document.getElementById('prof-phone').value,
                    address: document.getElementById('prof-address').value
                })
            });

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error("Resposta do servidor não é JSON: " + text.substring(0, 50));
            }

            if (res.ok) window.UI.toast('Perfil atualizado com sucesso!', 'success');
            else window.UI.toast(data.error || 'Erro ao atualizar.', 'error');
        } catch (err) {
            console.error('Update error:', err);
            window.UI.toast('Erro ao atualizar perfil: ' + (err.message || 'Erro de conexão ao servidor.'), 'error');
        }
        btn.disabled = false;
        btn.textContent = 'Salvar Alterações';
    });

    // Handle Photo Preview
    document.getElementById('prof-photo-input').addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('prof-img-preview').src = e.target.result;
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Fetch Orders
    try {
        const resOrders = await fetch('/api/orders');
        if (resOrders.ok) {
            const orders = await resOrders.json();
            const tbody = document.getElementById('orders-tbody');
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">Nenhum pedido encontrado.</td></tr>';
            } else {
                tbody.innerHTML = orders.map(o => `
                    <tr>
                        <td>#${o.id}</td>
                        <td>${new Date(o.created_at).toLocaleDateString()}</td>
                        <td><span class="status-pill">${o.status}</span></td>
                        <td>R$ ${o.total.toFixed(2).replace('.', ',')}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Erro ao buscar pedidos', e);
    }

    // Fetch Recommendations
    try {
        const resRecs = await fetch('/api/recommendations');
        if (resRecs.ok) {
            const recsData = await resRecs.json();
            // Choose lastPurchased if any, else mostPopular
            const items = recsData.lastPurchased.length > 0 ? recsData.lastPurchased : recsData.mostPopular;
            const c = document.getElementById('recs-container');

            if (items.length === 0) {
                c.innerHTML = 'Nenhuma recomendação disponível no momento.';
            } else {
                c.innerHTML = items.map(p => `
                    <div style="background: white; border-radius: 10px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); width: 200px;">
                        <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
                        <h4 style="margin: 10px 0 5px 0; font-size: 1rem;">${p.name}</h4>
                        <p style="font-weight: 600; color: #ff4757;">R$ ${p.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Erro ao buscar recomendações', e);
    }
});
